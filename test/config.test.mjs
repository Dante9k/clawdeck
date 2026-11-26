import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redact,
  restore,
  MASK,
  editable,
  applyEditable,
  scrubLogs,
  configDiff,
} from '../lib/config.mjs';
import { managed, metrics, demux } from '../lib/docker.mjs';
const original = {
  agents: { defaults: { model: { primary: 'provider/model' }, workspace: '/data/workspace' } },
  models: {
    providers: {
      provider: {
        apiKey: 'test-private',
        headers: { Authorization: 'also-private' },
        models: [{ id: 'model' }],
      },
    },
  },
  channels: { feishu: { accounts: { main: { appId: 'app-1', appSecret: 'private-feishu' } } } },
  gateway: { auth: { token: 'private-gateway' } },
};

test('reordering provider models keeps credentials bound to each unique model ID', () => {
  const config = structuredClone(original);
  config.models.providers.provider.models = [
    { id: 'a', headers: { Authorization: 'secret-a' } },
    { id: 'b', headers: { Authorization: 'secret-b' } },
  ];
  const draft = redact(editable(config));
  draft.providers.provider.models.reverse();
  const result = applyEditable(config, draft).models.providers.provider.models;
  assert.equal(result[0].id, 'b');
  assert.equal(result[0].headers.Authorization, 'secret-b');
  assert.equal(result[1].headers.Authorization, 'secret-a');
  draft.providers.provider.models[0].id = 'new';
  assert.throws(() => applyEditable(config, draft), /占位符/);
});
test('ambiguous secret arrays reject structural changes, duplicate IDs and new masks', () => {
  const items = [
    { name: 'a', token: 'one' },
    { name: 'b', token: 'two' },
  ];
  const safe = redact(items);
  assert.deepEqual(restore(safe, items), items);
  assert.throws(() => restore(safe.toReversed(), items), /唯一 id/);
  assert.throws(
    () =>
      restore(
        [
          { id: 'a', token: MASK },
          { id: 'a', token: MASK },
        ],
        [{ id: 'a', token: 'one' }],
      ),
    /唯一 id/,
  );
});
test('diff shows secret rotation without leaking old or new credentials', () => {
  const next = structuredClone(original);
  next.models.providers.provider.apiKey = 'replacement-secret';
  next.channels.feishu.accounts.main.appSecret = 'replacement-feishu';
  const diff = configDiff(original, next);
  assert.equal(diff.length, 2);
  const text = JSON.stringify(diff);
  for (const secret of [
    'test-private',
    'replacement-secret',
    'private-feishu',
    'replacement-feishu',
  ])
    assert.ok(!text.includes(secret));
});
test('nested secrets are masked, editable config excludes gateway credentials', () => {
  const safe = redact(editable(original));
  assert.equal(safe.providers.provider.apiKey, MASK);
  assert.equal(safe.providers.provider.headers, MASK);
  assert.equal(safe.channels.feishu.accounts.main.appSecret, MASK);
  assert.equal(safe.channels.feishu.accounts.main.appId, 'app-1');
  assert.ok(!JSON.stringify(safe).includes('private'));
  assert.ok(!('gateway' in safe));
});
test('unchanged secret markers survive a model edit and untouched sections remain identical', () => {
  const draft = redact(editable(original));
  draft.model.primary = 'provider/new-model';
  const next = applyEditable(original, draft);
  assert.equal(next.models.providers.provider.apiKey, 'test-private');
  assert.deepEqual(next.gateway, original.gateway);
  assert.equal(next.agents.defaults.workspace, '/data/workspace');
  assert.equal(next.agents.defaults.model.primary, 'provider/new-model');
  assert.equal(original.agents.defaults.model.primary, 'provider/model');
});
test('rotating one secret does not clear other credentials', () => {
  const draft = redact(editable(original));
  draft.providers.provider.apiKey = 'replacement';
  const next = applyEditable(original, draft);
  assert.equal(next.models.providers.provider.apiKey, 'replacement');
  assert.equal(next.channels.feishu.accounts.main.appSecret, 'private-feishu');
});
test('forged markers, unsupported sections and prototype injection are rejected', () => {
  assert.throws(() => restore({ apiKey: MASK }, {}));
  assert.throws(() => applyEditable(original, { gateway: { auth: { mode: 'none' } } }));
  assert.throws(() => restore(JSON.parse('{"__proto__":{"polluted":true}}'), {}));
  assert.throws(() => applyEditable(original, { channels: [] }));
  assert.equal({}.polluted, undefined);
});
test('explicit management exclusion wins over automatic discovery', () => {
  assert.equal(
    managed({ Image: 'openclaw:latest', Labels: { 'io.clawdeck.managed': 'false' } }),
    false,
  );
  assert.equal(managed({ Names: ['/openclaw-atlas'] }), true);
  assert.equal(managed({ Image: 'postgres:17' }), false);
  assert.equal(
    managed({ Config: { Image: 'custom:1', Labels: { 'io.clawdeck.managed': 'true' } } }),
    true,
  );
});
test('Docker CPU delta and memory cache use Docker conventions', () => {
  const result = metrics({
    cpu_stats: { cpu_usage: { total_usage: 200 }, system_cpu_usage: 1000, online_cpus: 4 },
    precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 500 },
    memory_stats: { usage: 800, stats: { inactive_file: 200 } },
  });
  assert.equal(result.cpu, 80);
  assert.equal(result.memory, 600);
  assert.equal(metrics({}).cpu, 0);
});
test('multiplexed logs decode stdout and stderr; TTY text is supported', () => {
  const frame = (stream, text) => {
    const content = Buffer.from(text);
    const header = Buffer.alloc(8);
    header[0] = stream;
    header.writeUInt32BE(content.length, 4);
    return Buffer.concat([header, content]);
  };
  assert.deepEqual(demux(Buffer.concat([frame(1, 'hello\n'), frame(2, 'error\n')])), {
    stdout: 'hello\n',
    stderr: 'error\n',
  });
  assert.equal(demux(Buffer.from('plain')).stdout, 'plain');
  assert.ok(
    !scrubLogs('apiKey=abcdef12345 token=some-token sk-verylongsecret123').includes('abcdef12345'),
  );
});
