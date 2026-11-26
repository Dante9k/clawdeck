export const MASK = '__CLAWDECK_SECRET_UNCHANGED__';
const secretKey =
  /(?:key|token|secret|password|credential|authorization|cookie|privatekey|serviceaccount)$/i;
export function redact(value, key = '') {
  if (value !== null && value !== '' && (secretKey.test(key) || key === 'env' || key === 'headers'))
    return MASK;
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  return value;
}
export function restore(value, original) {
  if (value === MASK) {
    if (original === undefined)
      throw Object.assign(new Error('密钥占位符没有对应的原值，请重新加载配置。'), { status: 400 });
    return structuredClone(original);
  }
  if (Array.isArray(value)) {
    const previous = Array.isArray(original) ? original : [];
    const containsMask = (v) => JSON.stringify(v)?.includes(MASK);
    const identifiable = (list) =>
      list.every((v) => v && typeof v === 'object' && typeof v.id === 'string') &&
      new Set(list.map((v) => v.id)).size === list.length;
    // Credentials follow stable model IDs, never an array position after a reorder.
    if (identifiable(value) && identifiable(previous))
      return value.map((v) =>
        restore(
          v,
          previous.find((old) => old.id === v.id),
        ),
      );
    if (value.some(containsMask)) {
      if (JSON.stringify(value) !== JSON.stringify(redact(previous)))
        throw Object.assign(
          new Error('含密钥的数组缺少唯一 id，无法安全合并；请保留原数组或显式填写新的凭据。'),
          { status: 400 },
        );
      return structuredClone(previous);
    }
    return value.map((v) => restore(v, undefined));
  }
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => {
        if (['__proto__', 'constructor', 'prototype'].includes(k))
          throw Object.assign(new Error('配置包含不支持的属性。'), { status: 400 });
        return [k, restore(v, original?.[k])];
      }),
    );
  return value;
}
export function editable(config) {
  return {
    model: config.agents?.defaults?.model ?? {},
    providers: config.models?.providers ?? {},
    channels: config.channels ?? {},
  };
}
export function applyEditable(config, patch) {
  if (
    !patch ||
    typeof patch !== 'object' ||
    Array.isArray(patch) ||
    Object.keys(patch).some((k) => !['model', 'providers', 'channels'].includes(k))
  )
    throw Object.assign(new Error('只支持 model、providers 和 channels 配置。'), { status: 400 });
  const output = structuredClone(config);
  const current = editable(config);
  const next = restore(patch, current);
  if ('model' in next) {
    if (
      typeof next.model !== 'string' &&
      (!next.model || typeof next.model !== 'object' || Array.isArray(next.model))
    )
      throw Object.assign(new Error('模型配置格式错误。'), { status: 400 });
    output.agents ??= {};
    output.agents.defaults ??= {};
    output.agents.defaults.model = next.model;
  }
  for (const name of ['providers', 'channels'])
    if (
      name in next &&
      (!next[name] || typeof next[name] !== 'object' || Array.isArray(next[name]))
    )
      throw Object.assign(new Error(`${name} 必须为对象。`), { status: 400 });
  if ('providers' in next) {
    output.models ??= {};
    output.models.providers = next.providers;
  }
  if ('channels' in next) output.channels = next.channels;
  return output;
}
export function scrubLogs(text) {
  return text
    .replace(/\b(sk-[\w-]{8,}|\d{6,}:[A-Za-z0-9_-]{20,})\b/g, '[REDACTED]')
    .replace(
      /((?:api[_-]?key|token|secret|password|authorization)["']?\s*[:=]\s*["']?)(?:Bearer\s+)?[^\s,"'\}\]]+/gi,
      '$1[REDACTED]',
    );
}

// Compare actual values server-side, but never return secret contents in a diff.
export function configDiff(before, after) {
  const changes = [];
  function walk(a, b, parts = []) {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const key = parts.at(-1) || '';
    if (secretKey.test(key) || ['env', 'headers'].includes(key)) {
      changes.push({
        path: parts.join('.'),
        before: a === undefined ? '未设置' : '[已隐藏]',
        after: b === undefined ? '已删除' : '[已更新，内容隐藏]',
      });
      return;
    }
    if (
      a &&
      b &&
      typeof a === 'object' &&
      typeof b === 'object' &&
      !Array.isArray(a) &&
      !Array.isArray(b)
    ) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
        walk(a[k], b[k], [...parts, k]);
    } else
      changes.push({
        path: parts.join('.'),
        before: a === undefined ? '未设置' : JSON.stringify(redact(a)),
        after: b === undefined ? '已删除' : JSON.stringify(redact(b)),
      });
  }
  walk(editable(before), editable(after));
  return changes;
}
