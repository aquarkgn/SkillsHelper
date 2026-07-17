// 只提取精确白名单 Bundle ID 的本机应用图标。固定品牌资产通过静态文件直接交付；
// 本模块绝不下载远程资源，也不接受 frontmatter 的 url:/emoji: 覆盖。
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { brandForBundleId, BRAND_REGISTRY, normalizeBrandKey, resolveIconRef as resolveStaticIconRef } from './brand-registry.mjs';

const execFileP = promisify(execFile);
const IS_MACOS = process.platform === 'darwin';
const VALID_SIZES = new Set([32, 64, 128]);
const cache = new Map();

function sizeOf(value) { return VALID_SIZES.has(value) ? value : 64; }

export function contentTypeForIconPath(iconPath) {
  return path.extname(iconPath).toLowerCase() === '.png' ? 'image/png' : 'application/octet-stream';
}

export async function locateApp(brand) {
  if (!IS_MACOS) return null;
  const id = normalizeBrandKey(brand);
  const entry = id ? BRAND_REGISTRY[id] : null;
  if (!entry) return null;
  for (const bundleId of entry.bundleIds) {
    try {
      const { stdout } = await execFileP('mdfind', [`kMDItemCFBundleIdentifier == '${bundleId}'`]);
      const appPath = stdout.split('\n').map((line) => line.trim()).find((line) => line.endsWith('.app') && fs.existsSync(line));
      if (appPath) return appPath;
    } catch { /* 未索引或未安装时回退固定资产。 */ }
  }
  return null;
}

async function icnsPath(appPath) {
  const info = path.join(appPath, 'Contents', 'Info.plist');
  const resources = path.join(appPath, 'Contents', 'Resources');
  try {
    const { stdout } = await execFileP('plutil', ['-extract', 'CFBundleIconFile', 'raw', info]);
    const name = stdout.trim();
    const candidate = path.join(resources, name.endsWith('.icns') ? name : `${name}.icns`);
    if (fs.existsSync(candidate)) return candidate;
  } catch { /* 某些 App 未填写 CFBundleIconFile。 */ }
  try { return fs.readdirSync(resources).find((name) => name.endsWith('.icns')) ? path.join(resources, fs.readdirSync(resources).find((name) => name.endsWith('.icns'))) : null; } catch { return null; }
}

export async function getIconForBrand(brand, size = 64) {
  const id = normalizeBrandKey(brand);
  if (!id || !IS_MACOS) return null;
  const key = `${id}:${sizeOf(size)}`;
  if (cache.has(key)) return cache.get(key);
  const appPath = await locateApp(id);
  if (!appPath) { cache.set(key, null); return null; }
  const source = await icnsPath(appPath);
  if (!source) { cache.set(key, null); return null; }
  const output = path.join(os.tmpdir(), `skillhelper-${id}-${sizeOf(size)}.png`);
  try {
    await execFileP('sips', ['-s', 'format', 'png', '-Z', String(sizeOf(size)), source, '--out', output]);
    const result = fs.existsSync(output) ? output : null;
    cache.set(key, result);
    return result;
  } catch { cache.set(key, null); return null; }
}

/** 纯函数：前端只消费受控的静态 IconRef；frontmatter 图标不参与品牌身份。 */
export function resolveIconRef(skill) {
  return resolveStaticIconRef({
    sourceBrand: skill?.sourceBrand,
    editorBrand: skill?.editorBrand,
    editor: skill?.editor,
    source: skill?.source,
  });
}

export function isAllowedBundleId(value) { return Boolean(brandForBundleId(value)); }
export { IS_MACOS };
