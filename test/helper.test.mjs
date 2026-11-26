import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { revision } from '../lib/config.mjs';
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/container-helper.cjs', import.meta.url), 'utf8');
function fixture(
  t,
  validate = () => ({ status: 0, stdout: '{"valid":true}' }),
  env = {},
  fsOverride = {},
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawdeck-helper-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'openclaw.json');
  const raw = '{"agents":{"defaults":{"model":{"primary":"p/old"}}},"gateway":{"port":18789}}\n';
  fs.writeFileSync(file, raw);
  const context = vm.createContext({
    require: (name) =>
      name === 'node:fs'
        ? { ...fs, ...fsOverride }
        : name === 'node:child_process'
          ? { spawnSync: validate }
          : name === 'node:readline'
            ? { createInterface: () => ({ once() {} }) }
            : require(name),
    process: { env, cwd: () => dir, execPath: process.execPath, stdin: null },
    console,
  });
  vm.runInContext(source, context);
  return {
    dir,
    file,
    raw,
    run(input) {
      context.input = { configPath: file, revision: revision(raw), ...input };
      return vm.runInContext('main(input)', context);
    },
  };
}
test('successful write validates candidate, keeps original backup, replaces atomically', (t) => {
  let seen = false;
  const f = fixture(t, (cmd, args, options) => {
    assert.ok(args.includes('validate'));
    assert.notEqual(options.env.OPENCLAW_CONFIG_PATH, f.file);
    assert.equal(
      JSON.parse(fs.readFileSync(options.env.OPENCLAW_CONFIG_PATH)).agents.defaults.model.primary,
      'p/new',
    );
    seen = true;
    return { status: 0, stdout: '{"valid":true}' };
  });
  const next = JSON.parse(f.raw);
  next.agents.defaults.model.primary = 'p/new';
  const result = f.run({ action: 'write', config: next });
  assert.ok(seen);
  assert.equal(fs.readFileSync(result.backup, 'utf8'), f.raw);
  assert.equal(JSON.parse(fs.readFileSync(f.file)).agents.defaults.model.primary, 'p/new');
  assert.ok(!fs.existsSync(f.file + '.clawdeck-lock'));
});
test('validation refusal never changes active file and cleans candidate/lock', (t) => {
  const f = fixture(t, () => ({ status: 1, stdout: '{"valid":false}' }));
  assert.throws(() => f.run({ action: 'write', config: {} }), /校验未通过/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), f.raw);
  assert.deepEqual(fs.readdirSync(f.dir), ['openclaw.json']);
});
test('validation success without explicit valid true is rejected', (t) => {
  const f = fixture(t, () => ({ status: 0, stdout: '{}' }));
  assert.throws(() => f.run({ action: 'write', config: {} }), /校验未通过/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), f.raw);
});
test('validate-only leaves active file untouched and creates no backup', (t) => {
  const f = fixture(t);
  assert.equal(f.run({ action: 'validate', config: {} }).valid, true);
  assert.equal(fs.readFileSync(f.file, 'utf8'), f.raw);
  assert.deepEqual(fs.readdirSync(f.dir), ['openclaw.json']);
});
test('preexisting and during-validation config conflicts are detected', (t) => {
  const f = fixture(t);
  assert.throws(() => f.run({ action: 'write', revision: 'stale', config: {} }), /配置已被/);
  const g = fixture(t, () => {
    fs.writeFileSync(g.file, '{"external":true}');
    return { status: 0, stdout: '{"valid":true}' };
  });
  assert.throws(() => g.run({ action: 'write', config: {} }), /校验期间/);
  assert.equal(fs.readFileSync(g.file, 'utf8'), '{"external":true}');
});
test('readonly config and include directives are refused', (t) => {
  const f = fixture(t, undefined, { OPENCLAW_CONFIG_READONLY: '1' });
  assert.throws(() => f.run({ action: 'write', config: {} }), /只读/);
  const g = fixture(t);
  fs.writeFileSync(g.file, '{"$include":"secrets.json"}');
  assert.throws(() => g.run({ action: 'read' }), /\$include/);
});

test('backups list only generated regular files and reject traversal', (t) => {
  const f = fixture(t);
  const next = JSON.parse(f.raw);
  next.agents.defaults.model.primary = 'p/new';
  const written = f.run({ action: 'write', config: next });
  const list = f.run({ action: 'backups' });
  assert.equal(list.backups.length, 1);
  assert.equal(list.backups[0].size, Buffer.byteLength(f.raw));
  const loaded = f.run({ action: 'backup', backup: list.backups[0].id });
  assert.equal(loaded.config.agents.defaults.model.primary, 'p/old');
  assert.throws(() => f.run({ action: 'backup', backup: '../../other' }), /无效/);
  assert.throws(() => f.run({ action: 'delete' }), /不支持/);
  assert.ok(fs.existsSync(written.backup));
});
test('lock cleanup failure after atomic replacement reports a warning without losing success', (t) => {
  const f = fixture(
    t,
    undefined,
    {},
    {
      unlinkSync: (file) => {
        if (file.endsWith('.clawdeck-lock')) throw new Error('permission denied');
        fs.unlinkSync(file);
      },
    },
  );
  const next = JSON.parse(f.raw);
  next.agents.defaults.model.primary = 'p/new';
  const result = f.run({ action: 'write', config: next });
  assert.match(result.warning, /操作已完成/);
  assert.equal(JSON.parse(fs.readFileSync(f.file)).agents.defaults.model.primary, 'p/new');
  assert.ok(result.revision);
});
test('helper emits complete large UTF-8 result and exits without forced stdout truncation', async (t) => {
  const f = fixture(t);
  const large = { channels: { example: { notes: '中文龙虾'.repeat(50000) } } };
  fs.writeFileSync(f.file, JSON.stringify(large));
  const child = spawn(process.execPath, ['-e', source], { stdio: ['pipe', 'pipe', 'pipe'] });
  const chunks = [];
  child.stdout.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  child.stdin.write(JSON.stringify({ action: 'read', configPath: f.file }) + '\n');
  const timeout = setTimeout(() => child.kill(), 10000);
  t.after(() => clearTimeout(timeout));
  assert.equal(await finished, 0);
  const result = JSON.parse(Buffer.concat(chunks).toString().slice(9));
  assert.deepEqual(result.config, large);
});
