import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { page } from '../website/page.mjs';

const output = new URL('../website/dist/', import.meta.url);
await mkdir(new URL('zh/', output), { recursive: true });
await Promise.all([
  writeFile(new URL('index.html', output), page('en')),
  writeFile(new URL('zh/index.html', output), page('zh')),
  ...[
    ['website/style.css', 'style.css'],
    ['website/site.js', 'site.js'],
    ['public/icon.svg', 'icon.svg'],
    ['preview.html', 'demo.html'],
  ].map(([from, to]) => copyFile(new URL('../' + from, import.meta.url), new URL(to, output))),
  writeFile(
    new URL('robots.txt', output),
    'User-agent: *\nAllow: /\nSitemap: https://clawdeck.jupyter-community.chatgpt.site/sitemap.xml\n',
  ),
  writeFile(
    new URL('sitemap.xml', output),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://clawdeck.jupyter-community.chatgpt.site/</loc></url><url><loc>https://clawdeck.jupyter-community.chatgpt.site/zh/</loc></url></urlset>',
  ),
]);
console.log('Built bilingual website in website/dist');
