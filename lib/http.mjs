export const fail = (status, message) => Object.assign(new Error(message), { status });

export function json(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(data));
}

export async function body(req) {
  const type = req.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw fail(415, '请求必须使用 JSON。');
  const chunks = [];
  let size = 0;
  for await (const part of req) {
    size += part.length;
    if (size > 256 * 1024) throw fail(413, '配置超过 256 KB 限制。');
    chunks.push(part);
  }
  try {
    const value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)) || '{}',
    );
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw fail(400, 'JSON 格式或 UTF-8 编码不正确。');
  }
}

export function verifyOrigin(req) {
  if (req.headers['x-clawdeck-request'] !== '1') throw fail(403, '请求来源验证失败。');
  if (!req.headers.origin) return;
  let origin;
  try {
    origin = new URL(req.headers.origin);
  } catch {
    throw fail(403, '不允许跨站请求。');
  }
  if (
    origin.host !== req.headers.host ||
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password
  )
    throw fail(403, '不允许跨站请求。');
}
