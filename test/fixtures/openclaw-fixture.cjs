#!/usr/bin/env node
// Protocol fixture only. This is NOT OpenClaw or a compatibility certification.
const fs = require('node:fs');
const file = process.env.OPENCLAW_CONFIG_PATH;
if (process.argv[2] === 'fixture-server') {
  fs.mkdirSync('/state', { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({
      agents: { defaults: { model: { primary: 'fixture/old' } } },
      models: {
        providers: {
          fixture: {
            apiKey: 'fixture-test-secret',
            models: [
              { id: 'old', name: 'Old' },
              { id: 'new', name: 'New' },
            ],
          },
        },
      },
      channels: {},
      gateway: { port: 18789 },
    }),
  );
  setInterval(() => {}, 1000);
} else if (process.argv[2] === 'config' && process.argv[3] === 'file')
  console.log(JSON.stringify({ path: file }));
else if (process.argv[2] === 'config' && process.argv[3] === 'validate') {
  try {
    const config = JSON.parse(fs.readFileSync(file));
    const model = config.agents?.defaults?.model;
    const primary = typeof model === 'string' ? model : model?.primary;
    const valid = !!primary && primary.startsWith('fixture/');
    console.log(JSON.stringify({ valid }));
    process.exitCode = valid ? 0 : 1;
  } catch {
    console.log('{"valid":false}');
    process.exitCode = 1;
  }
} else process.exitCode = 1;
