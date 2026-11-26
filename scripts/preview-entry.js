import { createDemoFetch } from './offline-runtime.js';

// All demo requests are resolved in memory. Nothing reaches a real Docker host.
globalThis.fetch = createDemoFetch();
await import('../public/app.js');
