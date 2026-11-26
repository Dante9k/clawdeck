import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Operations } from '../lib/operations.mjs';

const fingerprint = 'a'.repeat(64);
async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clawdeck-operations-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const operations = new Operations(directory);
  await operations.init();
  return { directory, operations };
}
test('expired IDs can be reused and concurrent reservations have one owner', async (t) => {
  const { operations } = await fixture(t);
  const id = 'expired-operation';
  const { item } = await operations.begin(id, fingerprint, 'atlas', 'start');
  await operations.finish(item, 'success', { ok: true });
  item.time = new Date(Date.now() - 25 * 3600e3).toISOString();
  const results = await Promise.all(
    Array.from({ length: 20 }, () => operations.begin(id, 'b'.repeat(64), 'atlas', 'stop')),
  );
  assert.equal(results.filter((result) => result.item).length, 1);
  assert.equal(results.filter((result) => result.previous).length, 19);
  assert.notEqual(results[0].item, item);
});
test('recovery orders by time and treats interrupted work as unknown', async (t) => {
  const { directory, operations } = await fixture(t);
  const older = (await operations.begin('zzzzzzzzzzzzzzzz', fingerprint, 'older', 'start')).item;
  older.time = new Date(Date.now() - 60_000).toISOString();
  await operations.persist(older);
  await operations.begin('aaaaaaaaaaaaaaaa', fingerprint, 'newer', 'stop');
  const restored = new Operations(directory);
  await restored.init();
  assert.deepEqual(
    restored.list().map((item) => item.name),
    ['newer', 'older'],
  );
  assert.ok(restored.list().every((item) => item.status === 'unknown'));
});
test('recovery rejects a persisted ID that does not match its filename', async (t) => {
  const { directory } = await fixture(t);
  await writeFile(
    path.join(directory, 'aaaaaaaaaaaaaaaa.json'),
    JSON.stringify({
      id: '../../outside',
      fingerprint,
      time: new Date().toISOString(),
      status: 'success',
      name: 'atlas',
      action: 'start',
    }),
  );
  await assert.rejects(new Operations(directory).init(), /格式不正确/);
});
test('failed persistence releases a reservation without poisoning subsequent work', async () => {
  const operations = new Operations(null);
  operations.persist = async () => {
    throw new Error('storage unavailable');
  };
  await assert.rejects(operations.begin('aaaaaaaaaaaaaaaa', fingerprint, 'atlas', 'start'));
  operations.persist = async () => {};
  assert.ok((await operations.begin('aaaaaaaaaaaaaaaa', fingerprint, 'atlas', 'start')).item);
  await assert.rejects(operations.begin('aaaaaaaaaaaaaaaa', 'b'.repeat(64), 'atlas', 'start'), {
    status: 409,
  });
});
