import { mkdir, readdir, readFile, writeFile, rename, unlink, lstat } from 'node:fs/promises';
import path from 'node:path';

const RETENTION_MS = 24 * 60 * 60 * 1000;
const ID = /^[a-zA-Z0-9_-]{16,80}$/;
const STATUSES = new Set(['running', 'success', 'failed', 'unknown']);
function validRecord(item, filename) {
  return (
    item &&
    ID.test(item.id) &&
    filename === `${item.id}.json` &&
    typeof item.fingerprint === 'string' &&
    /^[a-f0-9]{64}$/.test(item.fingerprint) &&
    Number.isFinite(Date.parse(item.time)) &&
    STATUSES.has(item.status) &&
    typeof item.name === 'string' &&
    typeof item.action === 'string'
  );
}

/** Durable, bounded idempotency records. One panel owns each data directory. */
export class Operations {
  constructor(directory) {
    this.directory = directory;
    this.items = new Map();
    this.reservations = Promise.resolve();
  }
  async init() {
    if (!this.directory) return;
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const files = (await readdir(this.directory)).filter((file) =>
      /^[a-zA-Z0-9_-]{16,80}\.json$/.test(file),
    );
    if (files.length > 2000) throw new Error('操作记录目录超过容量，请归档后重启。');
    for (const file of files) {
      const location = path.join(this.directory, file);
      const metadata = await lstat(location);
      if (!metadata.isFile() || metadata.size > 1024 * 1024)
        throw new Error('操作记录文件不安全，请检查数据卷。');
      let item;
      try {
        item = JSON.parse(await readFile(location, 'utf8'));
      } catch {
        throw new Error('操作记录损坏，请检查数据卷。');
      }
      if (!validRecord(item, file)) throw new Error('操作记录格式不正确，请检查数据卷。');
      if (Date.now() - Date.parse(item.time) > RETENTION_MS) {
        await unlink(location);
        continue;
      }
      if (item.status === 'running') {
        item.status = 'unknown';
        item.message = '面板在操作期间重启，结果未知；请核对实例状态，勿直接重试。';
      }
      this.items.set(item.id, item);
    }
  }
  async persist(item) {
    if (!this.directory) return;
    const file = path.join(this.directory, `${item.id}.json`);
    await writeFile(`${file}.tmp`, JSON.stringify(item), { mode: 0o600 });
    await rename(`${file}.tmp`, file);
  }
  begin(id, fingerprint, name, action) {
    // Pruning and reservation share a queue, so only one request owns an ID.
    const pending = this.reservations.then(() => this.reserve(id, fingerprint, name, action));
    this.reservations = pending.catch(() => {});
    return pending;
  }
  async reserve(id, fingerprint, name, action) {
    if (!ID.test(id)) throw Object.assign(new Error('无效操作编号。'), { status: 400 });
    for (const [key, item] of this.items) {
      if (Date.now() - Date.parse(item.time) <= RETENTION_MS || item.status === 'running') continue;
      if (this.directory)
        await unlink(path.join(this.directory, `${key}.json`)).catch((error) => {
          if (error.code !== 'ENOENT') throw error;
        });
      this.items.delete(key);
    }
    const previous = this.items.get(id);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw Object.assign(new Error('操作编号已用于不同请求。'), { status: 409 });
      return { previous };
    }
    if (this.items.size >= 1000)
      throw Object.assign(new Error('24 小时内操作数超过 1000，请稍后再试。'), { status: 429 });
    const item = {
      id,
      fingerprint,
      name,
      action,
      time: new Date().toISOString(),
      status: 'running',
      message: '操作已登记',
    };
    this.items.set(id, item);
    try {
      await this.persist(item);
    } catch (error) {
      this.items.delete(id);
      throw error;
    }
    return { item };
  }
  async finish(item, status, response, code = 200) {
    Object.assign(item, {
      status,
      response,
      code,
      message:
        response.warning || response.error || (status === 'success' ? '操作完成' : '结果需确认'),
      finishedAt: new Date().toISOString(),
    });
    try {
      await this.persist(item);
      return null;
    } catch {
      return '执行结果未能持久保存，请核对实例状态并检查面板数据卷。';
    }
  }
  list() {
    return [...this.items.values()]
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
      .slice(0, 100)
      .map(({ fingerprint, response, ...item }) => item);
  }
}
