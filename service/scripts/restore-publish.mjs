// restore-publish.mjs - 恢复发布：还原 workspace 依赖
// 在发布完成后运行

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..', '..');

const pkgBackup = path.join(PKG_ROOT, 'package.json.backup');

if (fs.existsSync(pkgBackup)) {
  fs.copyFileSync(pkgBackup, path.join(PKG_ROOT, 'package.json'));
  fs.unlinkSync(pkgBackup);
  console.log('Restored: package.json restored from backup');
}
