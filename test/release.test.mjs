import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { mkdtemp, rm, mkdir, rename, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.mjs';
import { Operations } from '../lib/operations.mjs';
const headers = { 'Content-Type': 'application/json', 'X-Clawdeck-Request': '1' };
async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clawdeck-release-'));
  const server = await createApp({ auditDir: directory, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const request = (route, method = 'GET', data = {}, extra = {}) =>
    fetch(base + '/api' + route, {
      method,
      headers: { ...headers, Cookie: cookie, ...extra },
      ...(method === 'POST' ? { body: JSON.stringify(data) } : {}),
    });
  if (!options.demo) {
    const response = await request('/login', 'POST', { password: options.password });
    cookie = response.headers.get('set-cookie').split(';')[0];
  }
  return { base, request, directory };
}

test('session cookies, logout and origin checks guard administrative APIs', async (t) => {
  const f = await fixture(t, { password: 'release-test-password' });
  assert.equal((await fetch(f.base + '/api/operations')).status, 401);
  assert.equal(
    (await f.request('/logout', 'POST', {}, { Origin: 'https://untrusted.example.com' })).status,
    403,
  );
  assert.equal((await f.request('/logout', 'POST', {}, { 'X-Clawdeck-Request': '' })).status, 403);
  assert.equal((await f.request('/session')).status, 200);
  assert.equal((await f.request('/logout', 'POST')).status, 200);
  assert.equal((await f.request('/operations')).status, 401);
  const login = await f.request('/login', 'POST', { password: 'release-test-password' });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.equal(
      (await f.request('/login', 'POST', { password: 'wrong-test-password' })).status,
      401,
    );
  }
  assert.equal(
    (await f.request('/login', 'POST', { password: 'release-test-password' })).status,
    429,
  );
});
test('UTF-8 split across TCP chunks preserves Chinese names; malformed UTF-8 is refused', async (t) => {
  const f = await fixture(t, { demo: true });
  const current = await (await f.request('/instances/atlas/config')).json();
  current.config.channels.feishu.accounts.main.name = '测试账号';
  const payload = Buffer.from(
    JSON.stringify({ config: current.config, revision: current.revision }),
  );
  const split = payload.indexOf(Buffer.from('测')) + 1;
  const response = await new Promise((resolve, reject) => {
    const req = http.request(
      f.base + '/api/instances/atlas/config',
      { method: 'POST', headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() }),
        );
      },
    );
    req.on('error', reject);
    req.write(payload.subarray(0, split));
    setTimeout(() => req.end(payload.subarray(split)), 25);
  });
  assert.equal(response.status, 200, response.text);
  const after = await (await f.request('/instances/atlas/config')).json();
  assert.equal(after.config.channels.feishu.accounts.main.name, '测试账号');
  const invalid = await fetch(f.base + '/api/instances/atlas/config', {
    method: 'POST',
    headers,
    body: Buffer.from([123, 34, 120, 34, 58, 34, 255, 34, 125]),
  });
  assert.equal(invalid.status, 400);
});
test('preview is redacted, restore recovers credentials, and stale restoration is refused', async (t) => {
  const f = await fixture(t, { demo: true });
  const before = await (await f.request('/instances/atlas/config')).json();
  const payload = structuredClone(before);
  payload.config.model.primary = 'anthropic/changed';
  payload.config.providers.anthropic.apiKey = 'new-test-credential';
  const preview = await (await f.request('/instances/atlas/preview', 'POST', payload)).json();
  assert.ok(preview.changes.some((c) => c.path.endsWith('apiKey')));
  assert.ok(!JSON.stringify(preview).includes('new-test-credential'));
  assert.equal((await f.request('/instances/atlas/config', 'POST', payload)).status, 200);
  const list = await (await f.request('/instances/atlas/backups')).json();
  assert.equal(list.backups.length, 1);
  assert.ok(!JSON.stringify(list).includes('credential'));
  const current = await (await f.request('/instances/atlas/config')).json();
  const restore = { backup: list.backups[0].id, revision: current.revision };
  assert.equal(
    (await f.request('/instances/atlas/restore', 'POST', { ...restore, revision: 'stale' })).status,
    409,
  );
  assert.equal((await f.request('/instances/atlas/restore', 'POST', restore)).status, 200);
  const restored = await (await f.request('/instances/atlas/config')).json();
  assert.deepEqual(restored.config, before.config);
  const ops = await (await f.request('/operations')).json();
  assert.ok(ops.operations.some((op) => op.action === 'restore' && op.status === 'success'));
  assert.ok(!JSON.stringify(ops).includes('new-test-credential'));
  assert.equal((await f.request('/instances/atlas/backups', 'POST', {})).status, 405);
});
test('automatic discovery cannot mutate or exec until explicitly labelled', async (t) => {
  let count = 0;
  const docker = {
    connect: async () => {},
    request: async (method) => {
      if (method === 'POST') count++;
      return {
        Id: 'auto',
        Name: '/openclaw-auto',
        Config: { Image: 'openclaw', Labels: {} },
        State: { Status: 'running' },
      };
    },
    exec: async () => {
      count++;
    },
  };
  const f = await fixture(t, { password: 'release-test-password', docker });
  for (const route of ['stop', 'config', 'diagnostics'])
    assert.equal((await f.request('/instances/auto/' + route, 'POST', {})).status, 403);
  assert.equal(count, 0);
});
test('audit failure after a Docker mutation returns success with warning; duplicate key never repeats it', async (t) => {
  let mutations = 0;
  const docker = {
    connect: async () => {},
    request: async (method) => {
      if (method === 'POST') {
        mutations++;
        await rename(path.join(f.directory, 'audit.jsonl'), path.join(f.directory, 'audit.saved'));
        await mkdir(path.join(f.directory, 'audit.jsonl'));
        return null;
      }
      return {
        Id: 'managed',
        Name: '/openclaw-managed',
        Config: { Labels: { 'io.clawdeck.managed': 'true' } },
        State: { Status: 'running' },
      };
    },
  };
  const f = await fixture(t, { password: 'release-test-password', docker });
  const extra = { 'Idempotency-Key': 'audit-regression-0001' };
  const response = await f.request('/instances/managed/restart', 'POST', {}, extra);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.match(result.warning, /审计/);
  const replay = await (await f.request('/instances/managed/restart', 'POST', {}, extra)).json();
  assert.equal(replay.replayed, true);
  assert.equal(mutations, 1);
  assert.equal((await f.request('/instances/managed/stop', 'POST', {}, extra)).status, 409);
});
test('interrupted Docker mutation reports unknown instead of suggesting failure/retry', async (t) => {
  const docker = {
    connect: async () => {},
    request: async (method) => {
      if (method === 'POST') throw new Error('timeout');
      return {
        Id: 'managed',
        Name: '/managed',
        Config: { Labels: { 'io.clawdeck.managed': 'true' } },
        State: { Status: 'running' },
      };
    },
  };
  const f = await fixture(t, { password: 'release-test-password', docker });
  const result = await (await f.request('/instances/managed/restart', 'POST', {})).json();
  assert.equal(result.status, 'unknown');
  assert.match(result.error, /勿直接重试/);
});
test('persisted operation results survive restart; interrupted operations become unknown', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clawdeck-operations-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const first = new Operations(directory);
  await first.init();
  const success = await first.begin('completed-operation', 'a'.repeat(64), 'test', 'restart');
  await first.finish(success.item, 'success', { ok: true });
  await first.begin('pending-operation-1', 'b'.repeat(64), 'test', 'config');
  const next = new Operations(directory);
  await next.init();
  assert.equal(
    (await next.begin('completed-operation', 'a'.repeat(64), 'test', 'restart')).previous.response
      .ok,
    true,
  );
  assert.equal(next.items.get('pending-operation-1').status, 'unknown');
  assert.ok(!JSON.stringify(next.list()).includes('fingerprint'));
  const stored = await readFile(path.join(directory, 'completed-operation.json'), 'utf8');
  assert.ok(!stored.includes('config":'));
});
