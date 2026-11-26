export class RequestGate {
  generation = 0;
  issue() {
    return ++this.generation;
  }
  accepts(token) {
    return token === this.generation;
  }
  invalidate() {
    this.generation++;
  }
}

export function mergeFields(original, fields) {
  const draft = structuredClone(original);
  for (const field of [...fields]
    .filter((f) => f.changed)
    .sort((a, b) => a.path.length - b.path.length)) {
    if (field.secret && field.value === '') continue;
    if (field.path.some((k) => ['__proto__', 'constructor', 'prototype'].includes(k)))
      throw new Error('不支持的属性');
    if (field.path[0] === 'model' && typeof draft.model === 'string')
      draft.model = { primary: draft.model };
    const value = field.checkbox ? field.value : field.json ? JSON.parse(field.value) : field.value;
    let target = draft;
    for (const key of field.path.slice(0, -1)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      target = target[key];
    }
    target[field.path.at(-1)] = value;
  }
  return draft;
}
