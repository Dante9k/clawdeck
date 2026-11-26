// Linux Docker integration against a clearly labelled CLI fixture, not OpenClaw.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const suffix = randomBytes(6).toString('hex'),
  gateway = 'clawdeck-test-gateway-' + suffix,
  panel = 'clawdeck-test-panel-' + suffix;
const image = 'clawdeck-fixture:' + suffix,
  password = randomBytes(24).toString('hex');
const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
let cookie = '',
  base = '';
async function request(route, method = 'GET', body = {}, extra = {}) {
  const response = await fetch(base + '/api' + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Clawdeck-Request': '1',
      Cookie: cookie,
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(75000),
  });
  const value = await response.json();
  assert.equal(response.status, 200, JSON.stringify(value));
  return { response, value };
}
async function ready(check) {
  for (let i = 0; i < 40; i++) {
    try {
      await check();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('Container readiness timed out');
}
try {
  docker('build', '-t', image, 'test/fixtures');
  const id = docker(
    'run',
    '-d',
    '--name',
    gateway,
    '--label',
    'io.clawdeck.managed=true',
    '--tmpfs',
    '/state',
    image,
  );
  await ready(() =>
    docker('exec', gateway, 'node', '-e', "require('node:fs').accessSync('/state/openclaw.json')"),
  );
  docker(
    'run',
    '-d',
    '--name',
    panel,
    '--read-only',
    '--tmpfs',
    '/data',
    '--tmpfs',
    '/tmp',
    '-v',
    '/var/run/docker.sock:/var/run/docker.sock',
    '-p',
    '127.0.0.1::3210',
    '-e',
    'PANEL_PASSWORD=' + password,
    'clawdeck:ci',
  );
  const address = docker('port', panel, '3210/tcp');
  base = 'http://' + address.split('\n')[0];
  await ready(async () => assert.equal((await fetch(base + '/api/session')).status, 200));
  const login = await request('/login', 'POST', { password });
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  assert.ok((await request('/overview')).value.instances.some((c) => c.id === id && c.writable));
  await request('/instances/' + id + '/diagnostics', 'POST');
  const before = (await request('/instances/' + id + '/config')).value;
  assert.ok(!JSON.stringify(before).includes('fixture-test-secret'));
  const body = { config: structuredClone(before.config), revision: before.revision };
  body.config.model.primary = 'fixture/new';
  assert.equal(
    (await request('/instances/' + id + '/preview', 'POST', body)).value.changes.length,
    1,
  );
  const key = { 'Idempotency-Key': 'smoke-config-' + suffix };
  await request('/instances/' + id + '/config', 'POST', body, key);
  assert.equal(
    (await request('/instances/' + id + '/config', 'POST', body, key)).value.replayed,
    true,
  );
  const backups = (await request('/instances/' + id + '/backups')).value.backups;
  assert.equal(backups.length, 1);
  const current = (await request('/instances/' + id + '/config')).value;
  await request('/instances/' + id + '/restore', 'POST', {
    backup: backups[0].id,
    revision: current.revision,
  });
  assert.deepEqual((await request('/instances/' + id + '/config')).value.config, before.config);
  await request('/instances/' + id + '/stop', 'POST');
  await request('/instances/' + id + '/start', 'POST');
  console.log(
    'Docker fixture smoke passed: exec, native-validation protocol, redaction, write, backup, restore, lifecycle, idempotency.',
  );
} finally {
  for (const name of [panel, gateway])
    try {
      docker('rm', '-f', name);
    } catch {}
  try {
    docker('image', 'rm', image);
  } catch {}
}
