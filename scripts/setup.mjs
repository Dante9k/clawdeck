import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
export async function initialize(directory) {
  const example = await readFile(path.join(directory, '.env.example'), 'utf8');
  const content = example.replace(
    /^PANEL_PASSWORD=.*$/m,
    'PANEL_PASSWORD=' + randomBytes(32).toString('hex'),
  );
  const file = path.join(directory, '.env');
  await writeFile(file, content, { flag: 'wx', mode: 0o600 });
  return file;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(
      '已生成随机管理密码，保存在 ' +
        (await initialize(path.dirname(path.dirname(fileURLToPath(import.meta.url))))) +
        '。请妥善保管该文件。',
    );
  } catch (error) {
    console.error(error.code === 'EEXIST' ? '.env 已存在，未覆盖。' : error.message);
    process.exitCode = 1;
  }
}
