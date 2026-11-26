import http from 'node:http';
export class Docker {
  constructor(socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock') {
    this.socketPath = socketPath;
    this.version = '';
  }
  async request(method, path, body, raw = false, timeout = 15000) {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const request = http.request(
        {
          socketPath: this.socketPath,
          path: this.version + path,
          method,
          headers: payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {},
        },
        (response) => {
          const parts = [];
          let size = 0;
          response.on('data', (chunk) => {
            size += chunk.length;
            if (size > 8 * 1024 * 1024) response.destroy(new Error('Docker response too large'));
            else parts.push(chunk);
          });
          response.on('error', reject);
          response.on('end', () => {
            const buffer = Buffer.concat(parts);
            if (response.statusCode >= 400)
              return reject(
                Object.assign(
                  new Error(
                    `Docker 操作失败（${response.statusCode}）。请检查容器状态和服务日志。`,
                  ),
                  { status: response.statusCode === 404 ? 404 : 502 },
                ),
              );
            try {
              resolve(raw ? buffer : buffer.length ? JSON.parse(buffer.toString()) : null);
            } catch {
              reject(new Error('Docker 返回了无效响应。'));
            }
          });
        },
      );
      // An inactivity timeout alone can be kept alive by a trickling response.
      const deadline = setTimeout(() => request.destroy(new Error('Docker 请求超时。')), timeout);
      request.once('close', () => clearTimeout(deadline));
      request.on('error', reject);
      request.end(payload);
    });
  }
  async connect() {
    if (!this.version) {
      const version = await this.request('GET', '/version');
      this.version = '/v' + version.ApiVersion;
    }
  }
  async exec(id, script, payload) {
    const execution = await this.request('POST', `/containers/${id}/exec`, {
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      Tty: false,
      Cmd: ['node', '-e', script],
    });
    const data = await new Promise((resolve, reject) => {
      const body = JSON.stringify({ Detach: false, Tty: false });
      const req = http.request({
        socketPath: this.socketPath,
        path: `${this.version}/exec/${execution.Id}/start`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Connection: 'Upgrade',
          Upgrade: 'tcp',
        },
      });
      let activeSocket;
      const timer = setTimeout(() => {
        (activeSocket || req).destroy(new Error('配置操作超时，请重新读取后确认状态。'));
      }, 65000);
      req.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      req.on('response', (res) => {
        res.resume();
        clearTimeout(timer);
        reject(new Error('Docker 不支持交互式 exec 连接。'));
      });
      req.on('upgrade', (res, socket, head) => {
        activeSocket = socket;
        const chunks = [head];
        let size = head.length;
        socket.on('data', (chunk) => {
          size += chunk.length;
          if (size > 4 * 1024 * 1024) socket.destroy(new Error('配置响应过大。'));
          else chunks.push(chunk);
        });
        socket.on('error', reject);
        socket.on('close', () => {
          clearTimeout(timer);
          reject(new Error('配置连接已关闭，请重新读取后确认状态。'));
        });
        socket.on('end', () => {
          clearTimeout(timer);
          try {
            resolve(demux(Buffer.concat(chunks)));
          } catch (error) {
            reject(error);
          }
        });
        socket.write(JSON.stringify(payload) + '\n');
      });
      req.end(body);
    });
    const status = await this.request('GET', `/exec/${execution.Id}/json`);
    const line = data.stdout.split('\n').find((line) => line.startsWith('CLAWDECK:'));
    if (!line)
      throw new Error('无法在容器内运行配置助手，请确认镜像包含 Node.js 和 OpenClaw CLI。');
    const result = JSON.parse(line.slice(9));
    if (!result.ok || status.ExitCode)
      throw Object.assign(new Error(result.error || '容器配置操作失败。'), {
        status: result.status || 422,
      });
    return result;
  }
}
export function demux(buffer, combine = false) {
  const out = [],
    err = [];
  let offset = 0;
  while (
    offset + 8 <= buffer.length &&
    [0, 1, 2].includes(buffer[offset]) &&
    buffer[offset + 1] === 0 &&
    buffer[offset + 2] === 0 &&
    buffer[offset + 3] === 0
  ) {
    const length = buffer.readUInt32BE(offset + 4);
    if (offset + 8 + length > buffer.length) throw new Error('Docker 数据帧不完整。');
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (buffer[offset] === 2) err.push(chunk);
    if (buffer[offset] !== 2 || combine) out.push(chunk);
    offset += 8 + length;
  }
  if (offset === 0) return { stdout: buffer.toString('utf8'), stderr: '' };
  if (offset !== buffer.length) throw new Error('Docker 数据帧不完整。');
  return {
    stdout: Buffer.concat(out).toString('utf8'),
    stderr: Buffer.concat(err).toString('utf8'),
  };
}
export function managed(container) {
  const labels = container.Labels || container.Config?.Labels || {};
  if (labels['io.clawdeck.managed'] === 'false') return false;
  return (
    labels['io.clawdeck.managed'] === 'true' ||
    /openclaw|clawdbot|moltbot/i.test(
      [container.Image || container.Config?.Image, ...(container.Names || [container.Name])].join(
        ' ',
      ),
    )
  );
}
export function metrics(stats) {
  const cpuDelta =
    (stats.cpu_stats?.cpu_usage?.total_usage || 0) -
    (stats.precpu_stats?.cpu_usage?.total_usage || 0);
  const systemDelta =
    (stats.cpu_stats?.system_cpu_usage || 0) - (stats.precpu_stats?.system_cpu_usage || 0);
  const cores =
    stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
  const cache =
    stats.memory_stats?.stats?.inactive_file ?? stats.memory_stats?.stats?.total_inactive_file ?? 0;
  return {
    cpu: systemDelta > 0 ? Math.max(0, (cpuDelta / systemDelta) * cores * 100) : 0,
    memory: Math.max(0, (stats.memory_stats?.usage || 0) - cache),
    memoryLimit: stats.memory_stats?.limit || 0,
  };
}
