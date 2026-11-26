import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Docker, demux, managed } from './lib/docker.mjs';
import { redact, revision, editable, applyEditable, scrubLogs, configDiff } from './lib/config.mjs';
import { demoData } from './lib/demo.mjs';
import { Operations } from './lib/operations.mjs';
import { AuditLog } from './lib/audit.mjs';
import { createFleet } from './lib/fleet.mjs';
import { fail, json, body, verifyOrigin } from './lib/http.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
const derivePassword = promisify(scryptCallback);
const validId = (id) => /^[a-zA-Z0-9_-]{1,64}$/.test(id);
export async function createApp(options = {}) {
  const demo = options.demo ?? false;
  const password = options.password ?? process.env.PANEL_PASSWORD;
  if (!demo && (!password || password.length < 16))
    throw new Error('请设置至少 16 位 PANEL_PASSWORD；演示请显式使用 --demo。');
  const passwordSalt = randomBytes(16);
  const passwordHash = password ? await derivePassword(password, passwordSalt, 32) : null;
  const docker = options.docker || new Docker();
  const demoState = demoData();
  const helper = await readFile(path.join(root, 'lib/container-helper.cjs'), 'utf8');
  const sessions = new Map(),
    attempts = new Map(),
    locks = new Set(),
    summaries = new Map();
  const auditDir = options.auditDir || process.env.DATA_DIR || path.join(root, 'data');
  const operations = new Operations(demo ? null : path.join(auditDir, 'operations'));
  await operations.init();
  const demoBackups = new Map();
  let auditWarning = null;
  const audit = new AuditLog(demo ? null : auditDir, demo ? demoState.events : []);
  await audit.init();
  const record = (...args) => audit.record(...args);
  const fleet = createFleet({ demo, demoState, docker, summaries });
  const list = fleet.list;
  async function instance(id) {
    if (!validId(id)) throw fail(400, '无效实例 ID。');
    if (demo) {
      const c = demoState.instances.find((c) => c.id === id);
      if (!c) throw fail(404, '实例不存在。');
      return c;
    }
    await docker.connect();
    const c = await docker.request('GET', `/containers/${id}/json`);
    if (!managed(c)) throw fail(403, '该容器不在 OpenClaw 管理范围内。');
    return {
      id: c.Id,
      writable: c.Config?.Labels?.['io.clawdeck.managed'] === 'true',
      name: c.Config?.Labels?.['io.clawdeck.name'] || c.Name.replace(/^\//, ''),
      state: c.State.Status,
      configPath: c.Config?.Labels?.['io.clawdeck.config-path'],
    };
  }
  async function config(c) {
    if (c.state !== 'running') throw fail(409, '请先启动容器，再读取或修改配置。');
    const value = demo
      ? {
          config: structuredClone(demoState.configs.get(c.id)),
          revision: revision(demoState.configs.get(c.id)),
          path: '/home/user/.openclaw/openclaw.json',
        }
      : await docker.exec(c.id, helper, { action: 'read', configPath: c.configPath });
    const model = value.config.agents?.defaults?.model;
    const summary = {
      model: typeof model === 'string' ? model : model?.primary || '未设置',
      channels: Object.keys(value.config.channels || {}),
      configSummary: true,
    };
    summaries.set(c.id, summary);
    if (demo) Object.assign(c, summary);
    fleet.invalidate();
    return value;
  }
  const app = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      const route = url.pathname;
      if (!route.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw fail(405, '不支持的请求方式。');
        const files = {
          '/': 'index.html',
          '/app.js': 'app.js',
          '/editor.js': 'editor.js',
          '/styles.css': 'styles.css',
          '/icon.svg': 'icon.svg',
        };
        if (!files[route]) throw fail(404, '页面不存在。');
        const data = await readFile(path.join(root, 'public', files[route]));
        res.writeHead(200, {
          'Content-Type': route.endsWith('.js')
            ? 'text/javascript; charset=utf-8'
            : route.endsWith('.css')
              ? 'text/css; charset=utf-8'
              : route.endsWith('.svg')
                ? 'image/svg+xml'
                : 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        return res.end(req.method === 'HEAD' ? undefined : data);
      }
      if (req.method !== 'GET') verifyOrigin(req);
      const sid = (req.headers.cookie || '')
        .split(';')
        .map((v) => v.trim())
        .find((v) => v.startsWith('clawdeck_session='))
        ?.split('=')[1];
      for (const [key, expires] of sessions) if (expires < Date.now()) sessions.delete(key);
      const authenticated = demo || !!(sid && sessions.has(sid));
      if (route === '/api/session' && req.method === 'GET')
        return json(res, 200, { authenticated, demo });
      if (route === '/api/login' && req.method === 'POST') {
        const input = await body(req);
        const ip = req.socket.remoteAddress;
        for (const [key, entry] of attempts)
          if (Date.now() - entry.at > 60000) attempts.delete(key);
        const attempt = attempts.get(ip) || { at: Date.now(), count: 0 };
        attempt.count++;
        attempts.set(ip, attempt);
        if (attempt.count > 8) throw fail(429, '尝试次数过多，请一分钟后重试。');
        if (
          typeof input.password !== 'string' ||
          !passwordHash ||
          !timingSafeEqual(await derivePassword(input.password, passwordSalt, 32), passwordHash)
        )
          throw fail(401, '管理密码不正确。');
        if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value);
        const token = randomBytes(32).toString('hex');
        sessions.set(token, Date.now() + 8 * 3600e3);
        attempts.delete(ip);
        return json(
          res,
          200,
          { ok: true },
          {
            'Set-Cookie': `clawdeck_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`,
          },
        );
      }
      if (!authenticated) throw fail(401, '请先登录。');
      if (route === '/api/logout' && req.method === 'POST') {
        sessions.delete(sid);
        return json(
          res,
          200,
          { ok: true },
          { 'Set-Cookie': 'clawdeck_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' },
        );
      }
      if (route === '/api/overview' && req.method === 'GET')
        return json(res, 200, {
          ...(await list()),
          demo,
          version,
          auditWarning,
          operations: operations.list(),
          updatedAt: new Date().toISOString(),
          events: audit.events,
        });
      if (route === '/api/operations' && req.method === 'GET')
        return json(res, 200, { operations: operations.list() });
      const match = route.match(
        /^\/api\/instances\/([\w-]+)\/(start|stop|restart|logs|config|validate|preview|backups|restore|diagnostics)$/,
      );
      if (!match) throw fail(404, '接口不存在。');
      const [, id, action] = match;
      const c = await instance(id);
      if (!demo && !c.writable && action !== 'logs')
        throw fail(
          403,
          '此容器仅自动发现。请添加 io.clawdeck.managed: "true" 并重新应用 Compose 后管理。',
        );
      if (action === 'logs' && req.method === 'GET') {
        const text = demo
          ? `${new Date().toISOString()} [gateway] ${c.container} · 演示日志\n${new Date().toISOString()} [gateway] listening on port 18789\n${new Date().toISOString()} [channels] configuration loaded\n${c.health === 'unhealthy' ? '[warn] health check failed; inspect upstream connection\n' : '[info] gateway ready\n'}`
          : demux(
              await docker.request(
                'GET',
                `/containers/${c.id}/logs?stdout=1&stderr=1&timestamps=1&tail=300`,
                undefined,
                true,
              ),
              true,
            ).stdout;
        return json(res, 200, { text: scrubLogs(text), demo });
      }
      if (action === 'config' && req.method === 'GET') {
        const current = await config(c);
        return json(res, 200, {
          config: redact(editable(current.config)),
          revision: current.revision,
          path: current.path,
          demo,
        });
      }
      if (action === 'backups' && req.method === 'GET') {
        if (c.state !== 'running') throw fail(409, '请先启动容器。');
        const result = demo
          ? { backups: (demoBackups.get(id) || []).map(({ config, ...item }) => item) }
          : await docker.exec(id, helper, { action: 'backups', configPath: c.configPath });
        return json(res, 200, { ...result, demo });
      }
      if (req.method !== 'POST') throw fail(405, '不支持的请求方式。');
      if (['logs', 'backups'].includes(action)) throw fail(405, '此接口只支持读取。');
      const input = await body(req);
      const mutating = ['start', 'stop', 'restart', 'config', 'restore'].includes(action);
      let operation;
      if (mutating) {
        const key = req.headers['idempotency-key'] || randomBytes(16).toString('hex');
        if (!/^[a-zA-Z0-9_-]{16,80}$/.test(key)) throw fail(400, '无效操作编号。');
        const started = await operations.begin(key, revision({ route, input }), c.name, action);
        if (started.previous) {
          const previous = started.previous;
          if (previous.response)
            return json(res, previous.code, {
              ...previous.response,
              replayed: true,
              operationId: key,
            });
          return json(res, 409, {
            error: previous.message,
            operationId: key,
            status: previous.status,
          });
        }
        operation = started.item;
      }
      const complete = async (result) => {
        let warning = null;
        try {
          await record(
            c.name,
            action,
            'success',
            action === 'config' || action === 'restore'
              ? '配置已保存，已创建修改前备份'
              : '容器操作已完成',
          );
          auditWarning = null;
        } catch {
          warning = '操作已执行，但审计记录写入失败；请检查面板数据卷。';
          auditWarning = warning;
        }
        warning = [result.warning, warning].filter(Boolean).join(' ') || null;
        const response = {
          ok: true,
          ...result,
          demo,
          operationId: operation.id,
          ...(warning ? { warning } : {}),
        };
        const storageWarning = await operations.finish(operation, 'success', response);
        if (storageWarning) {
          response.warning = [warning, storageWarning].filter(Boolean).join(' ');
          auditWarning = response.warning;
        }
        return json(res, 200, response);
      };
      if (locks.has(c.id)) {
        if (operation)
          await operations.finish(
            operation,
            'failed',
            { error: '该实例有操作正在进行，请稍后重试。' },
            409,
          );
        throw fail(409, '该实例有操作正在进行，请稍后重试。');
      }
      locks.add(c.id);
      let submitted = false;
      try {
        if (['start', 'stop', 'restart'].includes(action)) {
          await record(c.name, action, 'pending', '操作已提交');
          submitted = true;
          if (demo) {
            c.state = action === 'stop' ? 'exited' : 'running';
            if (action !== 'stop') {
              c.health = 'healthy';
              c.startedAt = new Date().toISOString();
            } else {
              c.cpu = 0;
              c.memory = 0;
            }
          } else
            await docker.request(
              'POST',
              `/containers/${c.id}/${action}?t=10`,
              undefined,
              false,
              30000,
            );
          fleet.invalidate();
          return await complete({});
        }
        const current = await config(c);
        if (action === 'diagnostics') {
          if (!demo)
            await docker.exec(id, helper, {
              action: 'validate',
              configPath: c.configPath,
              revision: current.revision,
              config: current.config,
            });
          return json(res, 200, {
            ok: true,
            demo,
            path: current.path,
            checks: [
              '容器运行中',
              '配置文件可读',
              '配置编辑已授权',
              demo ? '原生校验：演示模拟' : '原生校验通过；临时文件可写',
            ],
            note: '未测试模型或消息渠道连通性；目录挂载是否支持原子替换需要首次保存确认。',
          });
        }
        if (input.revision !== current.revision)
          throw fail(409, '配置已发生变化，请重新加载后再修改。');
        let next;
        if (input.backup && ['restore', 'preview'].includes(action)) {
          const old = demo
            ? (demoBackups.get(id) || []).find((b) => b.id === input.backup)
            : await docker.exec(id, helper, {
                action: 'backup',
                backup: input.backup,
                configPath: c.configPath,
              });
          if (!old) throw fail(404, '备份不存在。');
          next = applyEditable(current.config, editable(old.config));
        } else {
          if (action === 'restore') throw fail(400, '请选择备份。');
          next = applyEditable(current.config, input.config);
        }
        if (action === 'preview')
          return json(res, 200, {
            changes: configDiff(current.config, next),
            revision: current.revision,
            demo,
          });
        if (mutating) await record(c.name, action, 'pending', '配置保存已提交');
        let result;
        if (demo) {
          const model = next.agents?.defaults?.model;
          const primary = typeof model === 'string' ? model : model?.primary;
          if (primary && !/^[^\s/]+\/\S+$/.test(primary))
            throw fail(422, '模型格式应为 provider/model。');
          if (mutating) {
            const saved = demoBackups.get(id) || [];
            saved.unshift({
              id: randomBytes(8).toString('hex'),
              time: new Date().toISOString(),
              size: JSON.stringify(current.config).length,
              config: current.config,
            });
            demoBackups.set(id, saved.slice(0, 50));
            demoState.configs.set(c.id, next);
            summaries.delete(c.id);
            await config(c);
          }
          result = {
            valid: true,
            revision: revision(next),
            backup: '演示模式：备份不会写入真实容器',
          };
        } else {
          submitted = mutating;
          result = await docker.exec(c.id, helper, {
            action: action === 'validate' ? 'validate' : 'write',
            configPath: c.configPath,
            revision: current.revision,
            config: next,
          });
        }
        if (mutating) {
          summaries.delete(c.id);
          fleet.invalidate();
          return await complete(result);
        }
        return json(res, 200, { ok: true, ...result, demo });
      } catch (error) {
        const unknown = submitted && (!error.status || error.status >= 500);
        const message = unknown
          ? '请求已提交但未收到确定结果，请刷新状态或读取配置确认，勿直接重试。'
          : error.status
            ? error.message
            : '操作未提交，请检查 Docker 或面板数据卷。';
        if (operation)
          await operations.finish(
            operation,
            unknown ? 'unknown' : 'failed',
            { error: message, operationId: operation.id, status: unknown ? 'unknown' : 'failed' },
            error.status || 503,
          );
        await record(c.name, action, unknown ? 'warning' : 'error', message).catch(() => {});
        return json(res, error.status || 503, {
          error: message,
          operationId: operation?.id,
          status: unknown ? 'unknown' : 'failed',
        });
      } finally {
        locks.delete(c.id);
      }
    } catch (error) {
      if (!res.headersSent)
        json(res, error.status || 503, {
          error: error.status
            ? error.message
            : '无法连接 Docker 或完成操作，请检查 socket、权限及容器环境。',
        });
      else res.end();
    }
  });
  app.requestTimeout = 90000;
  app.headersTimeout = 10000;
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const demo = process.argv.includes('--demo');
  const port = Number(process.env.PORT || 3210);
  try {
    const app = await createApp({ demo });
    app.listen(port, demo ? '127.0.0.1' : process.env.HOST || '127.0.0.1', () =>
      console.log(`ClawDeck ${demo ? 'DEMO' : 'DOCKER'} · http://127.0.0.1:${port}`),
    );
    let closing = false;
    const shutdown = () => {
      if (closing) return;
      closing = true;
      console.log('正在停止接收新请求，等待进行中的操作完成。');
      const deadline = setTimeout(() => process.exit(1), 80000);
      deadline.unref();
      app.close(() => clearTimeout(deadline));
      app.closeIdleConnections();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
    app.on('error', (error) => {
      console.error(`HTTP 服务启动失败（${error.code || 'unknown'}）。`);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
