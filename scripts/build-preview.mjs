import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [html, css, svg, result] = await Promise.all([
  readFile(path.join(root, 'public/index.html'), 'utf8'),
  readFile(path.join(root, 'public/styles.css'), 'utf8'),
  readFile(path.join(root, 'public/icon.svg'), 'utf8'),
  build({
    absWorkingDir: root,
    entryPoints: ['scripts/preview-entry.js'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    charset: 'utf8',
  }),
]);
const icon = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const bundle = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const output = html
  .replace(/<link\s+rel="stylesheet"\s+href="\/styles.css"\s*\/?\s*>/, `<style>${css}</style>`)
  .replace(
    /<script\s+type="module"\s+src="\/app.js"\s*><\/script>/,
    `<script type="module">${bundle}</script>`,
  )
  .replace('href="/icon.svg"', `href="${icon}"`);
if (output.includes('src="/app.js"') || output.includes('href="/styles.css"'))
  throw new Error('Preview HTML template no longer matches expected asset tags.');
await writeFile(path.join(root, 'preview.html'), output);
console.log('Built preview.html — self-contained offline demo');
