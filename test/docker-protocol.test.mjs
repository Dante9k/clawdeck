import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { Docker, demux } from '../lib/docker.mjs';

test('trickling Docker responses cannot extend the absolute request deadline', async (t) => {
  const socketPath =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\clawdeck-timeout-${randomUUID()}`
      : path.join(os.tmpdir(), `clawdeck-${randomUUID()}.sock`);
  const server = http.createServer((_req, res) => {
    res.writeHead(200);
    res.write(' ');
    const interval = setInterval(() => res.write(' '), 10);
    res.on('close', () => clearInterval(interval));
  });
  server.listen(socketPath);
  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  await assert.rejects(new Docker(socketPath).request('GET', '/slow', undefined, true, 80), /超时/);
});

test('truncated multiplexed frames are rejected instead of silently dropping output', () => {
  const header = Buffer.alloc(8);
  header[0] = 1;
  header.writeUInt32BE(10, 4);
  assert.throws(() => demux(Buffer.concat([header, Buffer.from('short')])), /不完整/);
});
test('Docker exec uses version negotiation, fixed argv, and private stdin via upgraded socket', async (t) => {
  const socketPath =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\clawdeck-test-${randomUUID()}`
      : path.join(os.tmpdir(), `clawdeck-${randomUUID()}.sock`);
  let argv, received;
  const connections = new Set();
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/version') return res.end('{"ApiVersion":"1.47"}');
    if (req.url === '/v1.47/containers/test/exec') {
      const payload = JSON.parse(body);
      argv = payload.Cmd;
      assert.equal(payload.AttachStdin, true);
      return res.end('{"Id":"execution-1"}');
    }
    if (req.url === '/v1.47/exec/execution-1/json') return res.end('{"ExitCode":0}');
    res.statusCode = 404;
    res.end('{}');
  });
  server.on('connection', (socket) => {
    connections.add(socket);
    socket.on('close', () => connections.delete(socket));
  });
  server.on('upgrade', (req, socket, head) => {
    assert.equal(req.url, '/v1.47/exec/execution-1/start');
    socket.write('HTTP/1.1 101 UPGRADED\r\nConnection: Upgrade\r\nUpgrade: tcp\r\n\r\n');
    // The request's JSON start body may arrive in the upgrade head; consume it first.
    let bytes = Buffer.from(head);
    const startLength = Number(req.headers['content-length']);
    const consume = (chunk) => {
      bytes = Buffer.concat([bytes, chunk]);
      if (bytes.length <= startLength) return;
      const stdin = bytes.subarray(startLength).toString();
      if (!stdin.endsWith('\n')) return;
      received = JSON.parse(stdin);
      const content = Buffer.from('CLAWDECK:{"ok":true,"valid":true}\n');
      const frame = Buffer.alloc(8);
      frame[0] = 1;
      frame.writeUInt32BE(content.length, 4);
      socket.end(Buffer.concat([frame, content]));
    };
    socket.on('data', consume);
    consume(Buffer.alloc(0));
  });
  server.listen(socketPath);
  await once(server, 'listening');
  t.after(async () => {
    for (const c of connections) c.destroy();
    await new Promise((resolve) => server.close(resolve));
  });
  const docker = new Docker(socketPath);
  await docker.connect();
  const output = await docker.exec('test', 'fixed-script', {
    config: { apiKey: 'test-secret-stdin-only' },
  });
  assert.deepEqual(argv, ['node', '-e', 'fixed-script']);
  assert.equal(received.config.apiKey, 'test-secret-stdin-only');
  assert.equal(output.valid, true);
});
