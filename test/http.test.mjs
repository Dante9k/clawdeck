import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { body, verifyOrigin } from '../lib/http.mjs';

test('JSON media types are exact and malformed origins fail as forbidden', async () => {
  const request = Readable.from([Buffer.from('{}')]);
  request.headers = { 'content-type': 'application/jsonp' };
  await assert.rejects(body(request), { status: 415 });
  assert.throws(
    () =>
      verifyOrigin({ headers: { 'x-clawdeck-request': '1', origin: 'null', host: 'localhost' } }),
    { status: 403 },
  );
  assert.doesNotThrow(() =>
    verifyOrigin({
      headers: { 'x-clawdeck-request': '1', origin: 'http://localhost', host: 'localhost' },
    }),
  );
});
