import { readFile, appendFile, mkdir, stat, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export class AuditLog {
  constructor(directory, initial = []) {
    this.directory = directory;
    this.events = initial;
    this.queue = Promise.resolve();
  }
  async init() {
    if (!this.directory) return;
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      this.events = (await readFile(path.join(this.directory, 'audit.jsonl'), 'utf8'))
        .trim()
        .split('\n')
        .slice(-200)
        .map((line) => JSON.parse(line))
        .reverse();
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn('历史操作记录无法读取。');
    }
  }
  async record(name, action, result, message) {
    const event = {
      id: randomBytes(8).toString('hex'),
      time: new Date().toISOString(),
      name,
      action,
      result,
      message,
    };
    if (this.directory) {
      this.queue = this.queue
        .catch(() => {})
        .then(async () => {
          const file = path.join(this.directory, 'audit.jsonl');
          try {
            if ((await stat(file)).size > 5 * 1024 * 1024) await rename(file, `${file}.previous`);
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
          await appendFile(file, `${JSON.stringify(event)}\n`, { mode: 0o600 });
        });
      await this.queue;
    }
    this.events = [event, ...this.events].slice(0, 200);
  }
}
