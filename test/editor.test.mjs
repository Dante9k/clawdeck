import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { RequestGate, mergeFields } from '../public/editor.js';
import { webcrypto } from 'node:crypto';

test('untouched fields preserve omitted API type, model shorthand and channel defaults', () => {
  const original = {
    model: 'p/old',
    providers: { p: { models: [] } },
    channels: { telegram: { token: 'mask' } },
  };
  const fields = [
    { path: ['providers', 'p', 'api'], value: '', changed: false },
    { path: ['model', 'fallbacks'], value: '[]', json: true, changed: false },
    { path: ['channels', 'telegram', 'enabled'], value: true, checkbox: true, changed: false },
  ];
  assert.deepEqual(mergeFields(original, fields), original);
  const next = mergeFields(original, [
    { path: ['model', 'primary'], value: 'p/new', changed: true },
  ]);
  assert.deepEqual(next.model, { primary: 'p/new' });
  assert.equal(next.providers.p.api, undefined);
});
test('edited channel JSON is not overwritten by untouched simple fields', () => {
  const original = { channels: { telegram: { enabled: true } } };
  const fields = [
    { path: ['channels', 'telegram'], value: '{"enabled":false}', json: true, changed: true },
    { path: ['channels', 'telegram', 'enabled'], value: true, checkbox: true, changed: false },
  ];
  assert.equal(mergeFields(original, fields).channels.telegram.enabled, false);
  assert.throws(() => mergeFields({}, [{ path: ['__proto__', 'x'], value: 1, changed: true }]));
});
test('late config response cannot overwrite a newer loaded revision or unsaved draft', async () => {
  const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace('await boot();', '');
  const pending = [];
  const context = vm.createContext({
    RequestGate,
    mergeFields,
    structuredClone,
    document: { addEventListener() {} },
    window: { addEventListener() {} },
    setInterval() {},
    pending,
  });
  vm.runInContext(source, context);
  vm.runInContext(
    "drawDrawer=()=>{};api=()=>new Promise(resolve=>pending.push(resolve));state.drawer='atlas';",
    context,
  );
  const first = vm.runInContext('loadConfig()', context),
    second = vm.runInContext('loadConfig()', context);
  pending[1]({ config: { model: 'p/new' }, revision: 'new' });
  await second;
  vm.runInContext("state.draft.model='p/unsaved';state.dirty=true;", context);
  pending[0]({ config: { model: 'p/old' }, revision: 'old' });
  await first;
  assert.equal(vm.runInContext('state.draft.model', context), 'p/unsaved');
  assert.equal(vm.runInContext('state.revision', context), 'new');
  assert.equal(vm.runInContext('state.dirty', context), true);
});

async function batchContext(overrides = {}) {
  const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace('await boot();', '');
  const calls = [],
    notices = [];
  const context = vm.createContext({
    RequestGate,
    mergeFields,
    structuredClone,
    crypto: { randomUUID: () => 'test-operation-id' },
    document: { addEventListener() {} },
    window: { addEventListener() {} },
    setInterval() {},
    calls,
    notices,
    ...overrides,
  });
  vm.runInContext(source, context);
  vm.runInContext(
    `state.selected=new Set(['a','b','c']);state.data={instances:['a','b','c'].map(id=>({id,name:id,state:'running',writable:true}))};modelPrompt=async()=> 'p/new';reviewChanges=async()=>true;refresh=async()=>{};toast=message=>notices.push(message);api=async (route,options={})=>{if(options.method!=='POST')return {config:{model:{primary:'p/old'},providers:{p:{models:[{id:'new',name:'New'}]}},channels:{}},revision:'old'};calls.push(route);return route.endsWith('/preview')?{changes:[{path:'model.primary',before:'p/old',after:'p/new'}]}:{ok:true};};`,
    context,
  );
  return { context, calls, notices };
}
test('batch model preflight checks all targets before any mutation, and a failure prevents all writes', async () => {
  const f = await batchContext();
  vm.runInContext(
    "const originalApi=api;api=async route=>{if(route.includes('/b/'))throw new Error('unavailable');return originalApi(route);};",
    f.context,
  );
  await vm.runInContext('batchModel()', f.context);
  assert.ok(!f.calls.some((c) => c.endsWith('/config')));
  assert.equal(vm.runInContext('state.busy', f.context), false);
  assert.ok(f.notices.some((n) => n.includes('未执行批量修改')));
});
test('batch stops after a write failure and retains earlier successful operations', async () => {
  const f = await batchContext();
  vm.runInContext(
    "const originalApi=api;api=async (route,options)=>{if(route==='/instances/b/config'&&options?.method==='POST'){calls.push(route);throw new Error('conflict');}return originalApi(route,options);};",
    f.context,
  );
  await vm.runInContext('batchModel()', f.context);
  assert.deepEqual(
    f.calls.filter((c) => c.endsWith('/config')),
    ['/instances/a/config', '/instances/b/config'],
  );
  assert.ok(f.calls.indexOf('/instances/c/validate') < f.calls.indexOf('/instances/a/config'));
  assert.ok(f.notices.some((n) => n.includes('已完成 1 项')));
});
test('request IDs work on an HTTP LAN origin without randomUUID', async () => {
  const f = await batchContext({
    crypto: { getRandomValues: (array) => webcrypto.getRandomValues(array) },
  });
  const a = vm.runInContext('requestId()', f.context),
    b = vm.runInContext('requestId()', f.context);
  assert.match(a, /^[a-f0-9]{32}$/);
  assert.notEqual(a, b);
});
