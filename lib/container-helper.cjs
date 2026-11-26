// Sent as fixed code to Docker exec. Sensitive input travels through stdin, never argv.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const readline = require('node:readline');
const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
function parse(text) {
  try {
    return JSON.parse(text);
  } catch {}
  for (const base of [
    path.join(process.cwd(), 'package.json'),
    '/app/package.json',
    '/usr/local/lib/node_modules/openclaw/package.json',
  ]) {
    try {
      return createRequire(base)('json5').parse(text);
    } catch {}
  }
  throw new Error('无法解析 JSON5：镜像需要可用的 json5 模块；原配置未修改。');
}
function cli(args, env) {
  const options = {
    encoding: 'utf8',
    timeout: 45000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, ...env },
    shell: false,
  };
  let result = spawnSync('openclaw', args, options);
  if (result.error?.code === 'ENOENT' && fs.existsSync('/app/dist/index.js'))
    result = spawnSync(process.execPath, ['/app/dist/index.js', ...args], options);
  return result;
}
function main(input) {
  let file = input.configPath || process.env.OPENCLAW_CONFIG_PATH;
  if (!file) {
    const found = cli(['config', 'file', '--json']);
    try {
      file = JSON.parse(found.stdout).path;
    } catch {}
  }
  file =
    file ||
    path.join(
      process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), '.openclaw'),
      'openclaw.json',
    );
  if (!path.isAbsolute(file) || !fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink())
    throw new Error('配置必须是普通文件，不能是符号链接。');
  if (fs.statSync(file).size > 1024 * 1024)
    throw new Error('配置超过 1 MB，请在原部署环境中管理。');
  const raw = fs.readFileSync(file, 'utf8');
  const current = parse(raw);
  if (!current || typeof current !== 'object' || Array.isArray(current))
    throw new Error('配置根节点必须为对象。');
  if (JSON.stringify(current).includes('"$include"'))
    throw new Error('此配置使用 $include，请在原配置系统中管理；面板不会展开或覆盖引用。');
  if (input.action === 'read') return { config: current, revision: hash(raw), path: file };
  const prefix = path.basename(file) + '.clawdeck-backup-';
  const backupPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(?:-[a-f0-9]{16})?$/;
  if (input.action === 'backups') {
    const backups = fs
      .readdirSync(path.dirname(file))
      .filter((name) => name.startsWith(prefix) && backupPattern.test(name.slice(prefix.length)))
      .sort()
      .reverse()
      .slice(0, 50)
      .flatMap((name) => {
        const item = fs.lstatSync(path.join(path.dirname(file), name));
        return item.isFile() && !item.isSymbolicLink()
          ? [{ id: name.slice(prefix.length), size: item.size, time: item.mtime.toISOString() }]
          : [];
      });
    return { backups };
  }
  if (input.action === 'backup') {
    if (typeof input.backup !== 'string' || !backupPattern.test(input.backup))
      throw new Error('无效备份编号。');
    const saved = path.join(path.dirname(file), prefix + input.backup);
    const info = fs.lstatSync(saved);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024)
      throw new Error('备份必须是小于 1 MB 的普通文件。');
    return { config: parse(fs.readFileSync(saved, 'utf8')), revision: hash(raw) };
  }
  if (!['write', 'validate'].includes(input.action)) throw new Error('不支持的配置操作。');
  if (process.env.OPENCLAW_CONFIG_READONLY === '1' || process.env.OPENCLAW_NIX_MODE === '1')
    throw new Error('该实例声明了只读配置，无法从面板修改。');
  if (input.revision !== hash(raw))
    throw Object.assign(new Error('配置已被其他操作修改，请重新加载。'), { status: 409 });
  // The server has already merged only the three supported configuration sections.
  const candidate = JSON.stringify(input.config, null, 2) + '\n';
  const dir = path.dirname(file);
  const tag = crypto.randomBytes(8).toString('hex');
  const tmp = path.join(dir, `.clawdeck-${tag}.json`);
  const lock = file + '.clawdeck-lock';
  let lockFd, output;
  try {
    try {
      lockFd = fs.openSync(lock, 'wx', 0o600);
    } catch {
      throw new Error('另一项配置操作正在进行，请稍后重试。');
    }
    fs.writeFileSync(tmp, candidate, { mode: 0o600, flag: 'wx' });
    const validation = cli(['config', 'validate', '--json'], { OPENCLAW_CONFIG_PATH: tmp });
    let report;
    try {
      report = JSON.parse(validation.stdout);
    } catch {}
    if (validation.status !== 0 || report?.valid !== true)
      throw new Error(
        'OpenClaw 原生配置校验未通过（或镜像不支持 config validate --json），原配置未修改。请在实例内运行 config validate 查看原因。',
      );
    if (hash(fs.readFileSync(file, 'utf8')) !== input.revision)
      throw Object.assign(new Error('校验期间配置发生变化，请重新加载。'), { status: 409 });
    if (input.action === 'validate') return (output = { valid: true });
    const backup =
      file + '.clawdeck-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + tag;
    fs.writeFileSync(backup, raw, { mode: 0o600, flag: 'wx' });
    fs.chmodSync(tmp, fs.statSync(file).mode & 0o600);
    fs.renameSync(tmp, file);
    return (output = { revision: hash(candidate), backup });
  } finally {
    let cleanupFailed = false;
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      cleanupFailed = true;
    }
    if (lockFd !== undefined) {
      try {
        fs.closeSync(lockFd);
      } catch {
        cleanupFailed = true;
      }
      try {
        fs.unlinkSync(lock);
      } catch {
        cleanupFailed = true;
      }
    }
    if (cleanupFailed && output)
      output.warning = '本次操作已完成，但临时文件或配置锁未能清理；请检查实例目录权限。';
  }
}
const reader = readline.createInterface({ input: process.stdin });
reader.once('line', (line) => {
  reader.close();
  process.stdin.destroy();
  let result;
  try {
    result = { ok: true, ...main(JSON.parse(line)) };
  } catch (error) {
    const safe = ['ENOENT', 'EACCES', 'EROFS', 'EBUSY'].includes(error.code)
      ? `配置文件操作失败（${error.code}），原文件未主动覆盖。`
      : error.message;
    result = { ok: false, error: safe, status: error.status || 422 };
    process.exitCode = 1;
  }
  // Linux pipes are asynchronous: exit only after Node has drained stdout.
  process.stdout.write('CLAWDECK:' + JSON.stringify(result) + '\n');
});
