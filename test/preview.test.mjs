import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { createDemoFetch } from '../scripts/offline-runtime.js';

test('offline preview embeds resources and contains valid bundled module JavaScript', async (t) => {
  const html = await readFile(new URL('../preview.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('src="/app.js"'));
  assert.ok(!html.includes('href="/styles.css"'));
  assert.ok(!html.includes('src="/icon.svg"'));
  assert.ok(html.includes('globalThis.fetch = createDemoFetch()'));
  assert.ok(html.includes('演示模式'));
  const script = html.match(/<script type="module">([\s\S]+?)<\/script>/)[1];
  assert.ok(!/import\s*\(/.test(script), 'no external dynamic imports');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clawdeck-preview-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'preview.mjs');
  await writeFile(file, script);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('offline API uses the shared masked preview, save and restore flow', async () => {
  const fetch = createDemoFetch();
  const call = async (route, input) =>
    (
      await fetch('/api' + route, input ? { method: 'POST', body: JSON.stringify(input) } : {})
    ).json();
  const original = await call('/instances/atlas/config');
  const payload = structuredClone(original);
  payload.config.model.primary = 'anthropic/preview-model';
  const preview = await call('/instances/atlas/preview', payload);
  assert.equal(preview.changes.length, 1);
  assert.ok(!JSON.stringify(preview).includes('test-secret-never-return'));
  assert.equal((await call('/instances/atlas/config', payload)).ok, true);
  const backups = await call('/instances/atlas/backups');
  assert.equal(backups.backups.length, 1);
  const current = await call('/instances/atlas/config');
  assert.equal(
    (
      await call('/instances/atlas/restore', {
        revision: current.revision,
        backup: backups.backups[0].id,
      })
    ).ok,
    true,
  );
  assert.deepEqual((await call('/instances/atlas/config')).config, original.config);
});
