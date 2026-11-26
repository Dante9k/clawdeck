import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { initialize } from '../scripts/setup.mjs';
test('setup generates a strong password without overwriting an existing env file', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clawdeck-setup-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, '.env.example'), 'PANEL_PASSWORD=\nPANEL_BIND=127.0.0.1\n');
  const file = await initialize(directory),
    original = await readFile(file, 'utf8');
  assert.match(original, /PANEL_PASSWORD=[a-f0-9]{64}/);
  assert.ok(original.includes('PANEL_BIND=127.0.0.1'));
  await assert.rejects(() => initialize(directory), { code: 'EEXIST' });
  assert.equal(await readFile(file, 'utf8'), original);
  if (process.platform !== 'win32') assert.equal((await stat(file)).mode & 0o777, 0o600);
});
