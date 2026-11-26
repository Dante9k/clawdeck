import { demoData } from '../lib/demo.mjs';
import { redact, editable, applyEditable, configDiff } from '../lib/config-core.mjs';
const requestId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
// This revision is for the in-memory demonstration only; production uses SHA-256.
const revision = (value) => {
  let hash = 2166136261;
  for (const c of JSON.stringify(value)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return 'demo-' + (hash >>> 0).toString(16);
};
export function createDemoFetch() {
  const previewDB = demoData(),
    previewBackups = new Map(),
    previewOperations = [];
  return async function demoFetch(url, options = {}) {
    const route = url.replace(/^\/api/, '');
    const respond = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    const record = (c, action, message) => {
      const item = {
        id: requestId(),
        time: new Date().toISOString(),
        name: c.name,
        action,
        result: 'success',
        status: 'success',
        message,
      };
      previewDB.events.unshift(item);
      previewOperations.unshift(item);
    };
    try {
      if (route === '/session') return respond({ authenticated: true, demo: true });
      if (route === '/overview')
        return respond({
          instances: previewDB.instances,
          server: previewDB.server,
          events: previewDB.events,
          operations: previewOperations,
          demo: true,
          updatedAt: new Date().toISOString(),
        });
      const match = route.match(
        /^\/instances\/([\w-]+)\/(start|stop|restart|logs|config|validate|preview|backups|restore|diagnostics)$/,
      );
      if (!match) return respond({ error: '离线预览不支持此操作。' }, 404);
      const [, id, action] = match,
        c = previewDB.instances.find((c) => c.id === id);
      if (!c) return respond({ error: '演示实例不存在。' }, 404);
      if (action === 'logs')
        return respond({
          text:
            new Date().toISOString() +
            ' [DEMO] ' +
            c.container +
            '\n[info] offline preview · no real server connected',
          demo: true,
        });
      if (['start', 'stop', 'restart'].includes(action)) {
        c.state = action === 'stop' ? 'exited' : 'running';
        if (action !== 'stop') {
          c.health = 'healthy';
          c.startedAt = new Date().toISOString();
        } else {
          c.cpu = 0;
          c.memory = 0;
        }
        record(c, action, '演示容器操作完成');
        return respond({ ok: true });
      }
      if (c.state !== 'running') return respond({ error: '请先启动演示实例。' }, 409);
      const raw = previewDB.configs.get(id);
      if (action === 'diagnostics')
        return respond({
          ok: true,
          demo: true,
          checks: ['离线演示模拟检查'],
          note: '未连接 Docker，未执行原生校验。',
        });
      if (action === 'backups')
        return respond({
          backups: (previewBackups.get(id) || []).map(({ config, ...b }) => b),
          demo: true,
        });
      if (options.method !== 'POST')
        return respond({
          config: redact(editable(raw)),
          revision: revision(raw),
          path: '/home/user/.openclaw/openclaw.json',
          demo: true,
        });
      const input = JSON.parse(options.body);
      if (input.revision !== revision(raw))
        return respond({ error: '演示配置已变化，请重新读取。' }, 409);
      const old = input.backup
        ? (previewBackups.get(id) || []).find((b) => b.id === input.backup)
        : null;
      if (input.backup && !old) return respond({ error: '备份不存在' }, 404);
      const next = applyEditable(raw, old ? editable(old.config) : input.config);
      if (action === 'preview')
        return respond({ changes: configDiff(raw, next), revision: revision(raw), demo: true });
      const model = next.agents.defaults.model,
        primary = typeof model === 'string' ? model : model.primary;
      if (primary && !/^[^\s/]+\/\S+$/.test(primary))
        return respond({ error: '模型格式应为 provider/model。' }, 422);
      if (action === 'config' || action === 'restore') {
        const backups = previewBackups.get(id) || [];
        backups.unshift({
          id: requestId(),
          time: new Date().toISOString(),
          size: JSON.stringify(raw).length,
          config: structuredClone(raw),
        });
        previewBackups.set(id, backups.slice(0, 50));
        previewDB.configs.set(id, next);
        c.model = primary || '未设置';
        c.channels = Object.keys(next.channels || {});
        record(c, action, '演示配置已保存（内存）');
      }
      return respond({ ok: true, valid: true, revision: revision(next), demo: true });
    } catch (error) {
      return respond({ error: error.message }, 400);
    }
  };
}
