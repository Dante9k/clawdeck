import { createHash } from 'node:crypto';
export * from './config-core.mjs';
export const revision = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
