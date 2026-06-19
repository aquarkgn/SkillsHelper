// prepare-publish.mjs - 准备发布：清理 workspace 依赖
// 在 npm publish 之前运行，将 @huhaa/* 依赖替换为打包后的本地源码

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..', '..');

const mainPkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));

// 保存原始 package.json
const pkgBackup = path.join(PKG_ROOT, 'package.json.backup');
if (!fs.existsSync(pkgBackup)) {
  fs.copyFileSync(path.join(PKG_ROOT, 'package.json'), pkgBackup);
}

// 替换 workspace 依赖为本地文件引用
const deps = { ...mainPkg.dependencies, ...mainPkg.devDependencies };
for (const [name, version] of Object.entries(deps)) {
  if (name.startsWith('@huhaa/') && version === '*') {
    console.log(`Replacing ${name}: * with file: reference`);
    
    // 找到对应的子包
    const pkgName = name.replace('@huhaa/', '');
    const pkgPath = `service/packages/${pkgName}`;
    
    if (mainPkg.dependencies?.[name]) {
      mainPkg.dependencies[name] = `file:${pkgPath}`;
    }
    if (mainPkg.devDependencies?.[name]) {
      mainPkg.devDependencies[name] = `file:${pkgPath}`;
    }
  }
}

// 写入修改后的 package.json
fs.writeFileSync(
  path.join(PKG_ROOT, 'package.json'),
  JSON.stringify(mainPkg, null, 2) + '\n'
);

console.log('Prepared for publish: workspace dependencies replaced with file: references');
