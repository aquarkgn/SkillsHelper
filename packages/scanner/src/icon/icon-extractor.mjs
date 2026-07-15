// icon-extractor.mjs — extract official icons for skills/commands.
//
// Priority chain:
//   1. local macOS .app icon (official installed application icon)
//   2. bundled local icon under packages/web/public/<localIconBase>-{size}.png
//   3. registered official remote icon URL, downloaded once and cached locally
//   4. no icon (frontend renders a neutral placeholder; never a fake brand icon)

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { normalizeBrandKey, resolveBrandSpec } from './brand-map.mjs';
import { atomicWriteBytes, atomicWriteText } from '../core/atomic-write.mjs';

const execFileP = promisify(execFile);
const IS_MACOS = process.platform === 'darwin';
const APP_DIRS = [
  '/Applications',
  path.join(os.homedir(), 'Applications'),
  '/System/Applications',
];
const VALID_SIZES = new Set([32, 64, 128]);
const MAX_REMOTE_ICON_BYTES = 1024 * 1024;

// In-memory caches (per process). locateApp is stable within a session.
const appPathCache = new Map(); // brand -> appPath|null
const iconPathCache = new Map(); // `${brand}:${size}` -> iconPath|null

export function cacheDir() {
  const base =
    process.env.SKILLHELPER_HOME?.trim() ||
    path.join(process.env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), '.config'), 'skillhelper');
  return path.join(expandTilde(base), 'icon-cache');
}

function expandTilde(p) {
  if (!p) return p;
  if (p === '~' || p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'icon';
}

function clampSize(size) {
  return VALID_SIZES.has(size) ? size : 64;
}

function remoteDisabled() {
  return process.env.SKILLHELPER_ICON_REMOTE === '0';
}

function extensionForContentType(contentType) {
  const clean = String(contentType || '').toLowerCase().split(';')[0].trim();
  switch (clean) {
    case 'image/png': return '.png';
    case 'image/svg+xml': return '.svg';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon': return '.ico';
    case 'image/jpeg': return '.jpg';
    case 'image/webp': return '.webp';
    default: return '';
  }
}

function extensionForUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.png', '.svg', '.ico', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext;
    }
  } catch {
    // ignore invalid URL — caller validates separately
  }
  return '';
}

export function contentTypeForIconPath(iconPath) {
  const ext = path.extname(iconPath || '').toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

function remoteMetaPath(brand) {
  return path.join(cacheDir(), `${slugify(normalizeBrandKey(brand) || brand)}.remote.json`);
}

function readRemoteCache(brand) {
  try {
    const meta = JSON.parse(fs.readFileSync(remoteMetaPath(brand), 'utf8'));
    if (!meta?.fileName || !meta?.contentType) return null;
    const filePath = path.join(cacheDir(), meta.fileName);
    if (!fs.existsSync(filePath)) return null;
    return filePath;
  } catch {
    return null;
  }
}

function validateOfficialUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  return url;
}

async function readResponseBytes(response) {
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    const buf = Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_REMOTE_ICON_BYTES) {
      throw new Error('remote icon too large');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function downloadOfficialIcon(brand, spec) {
  if (!spec?.officialIconUrls?.length) return null;
  if (spec.remoteIconCache === false) return null;
  if (remoteDisabled()) return null;

  const dir = cacheDir();
  fs.mkdirSync(dir, { recursive: true });
  const normalized = normalizeBrandKey(brand) || String(brand || '').toLowerCase().trim();

  for (const rawUrl of spec.officialIconUrls) {
    const url = validateOfficialUrl(rawUrl);
    if (!url) continue;

    try {
      const response = await fetch(url, {
        headers: {
          accept: 'image/avif,image/webp,image/svg+xml,image/png,image/*,*/*;q=0.8',
          'user-agent': 'SkillHelper/official-icon-fetcher',
        },
        redirect: 'follow',
      });
      if (!response.ok || !response.body) continue;

      const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!contentType.startsWith('image/')) continue;

      const bytes = await readResponseBytes(response);
      if (!bytes.length) continue;

      const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
      const ext = extensionForContentType(contentType) || extensionForUrl(response.url || rawUrl) || '.img';
      const fileName = `${slugify(normalized)}-remote-${sha256.slice(0, 12)}${ext}`;
      const filePath = path.join(dir, fileName);
      // v0.4 原子写：临时文件 + rename，进程中断不残留半截文件
      atomicWriteBytes(filePath, bytes);
      atomicWriteText(remoteMetaPath(normalized), JSON.stringify({
        brand: normalized,
        sourceUrl: rawUrl,
        finalUrl: response.url || rawUrl,
        contentType,
        sha256,
        fetchedAt: new Date().toISOString(),
        fileName,
      }, null, 2));
      return filePath;
    } catch {
      // Try the next registered official URL. The API layer reports fallback.
    }
  }

  return null;
}

/**
 * Locate the .app bundle for a brand/source key (or raw bundle id).
 * @param {string} brand
 * @returns {Promise<string|null>} absolute path to the .app or null
 */
export async function locateApp(brand) {
  if (!IS_MACOS || !brand) return null;
  const normalized = normalizeBrandKey(brand) || String(brand).toLowerCase().trim();
  if (appPathCache.has(normalized)) return appPathCache.get(normalized);

  const spec = resolveBrandSpec(brand);
  if (!spec) {
    appPathCache.set(normalized, null);
    return null;
  }

  let found = null;

  // 1. Bundle ID via Spotlight — fastest and most accurate.
  for (const bundleId of spec.bundleIds || []) {
    const p = await mdfindBundle(bundleId);
    if (p) {
      found = p;
      break;
    }
  }

  // 2. App-name scan of /Applications (case-insensitive) as fallback.
  if (!found) {
    found = scanAppDirs(spec.appNames || []);
  }

  appPathCache.set(normalized, found);
  return found;
}

async function mdfindBundle(bundleId) {
  try {
    const { stdout } = await execFileP('mdfind', [
      `kMDItemCFBundleIdentifier == '${bundleId}'`,
    ]);
    const first = stdout.split('\n').map(s => s.trim()).find(s => s.endsWith('.app') && fs.existsSync(s));
    return first || null;
  } catch {
    return null;
  }
}

function scanAppDirs(appNames) {
  if (!appNames?.length) return null;
  const wanted = new Set(appNames.map(n => `${n.toLowerCase()}.app`));
  for (const dir of APP_DIRS) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (wanted.has(entry.toLowerCase())) {
        return path.join(dir, entry);
      }
    }
  }
  return null;
}

/**
 * Extract a PNG icon from an .app bundle at the given size, with disk cache.
 * Cache is invalidated when the .app's mtime is newer than the cached PNG.
 * @param {string} appPath  — absolute path to a .app bundle
 * @param {number} size     — 32 | 64 | 128
 * @returns {Promise<string|null>} path to the cached PNG or null
 */
export async function extractIconPng(appPath, size) {
  if (!IS_MACOS || !appPath) return null;
  const dir = cacheDir();
  fs.mkdirSync(dir, { recursive: true });
  const pngPath = path.join(dir, `${slugify(path.basename(appPath, '.app'))}-${size}.png`);

  // Reuse cache if fresh (app not modified since PNG was written).
  try {
    const appStat = fs.statSync(appPath);
    const pngStat = fs.statSync(pngPath);
    if (pngStat.mtimeMs >= appStat.mtimeMs) return pngPath;
  } catch {
    // png missing → fall through to (re)build
  }

  const icnsPath = await findIcnsPath(appPath);
  if (!icnsPath) return null;

  try {
    await execFileP('sips', ['-s', 'format', 'png', '-Z', String(size), icnsPath, '--out', pngPath]);
    return fs.existsSync(pngPath) ? pngPath : null;
  } catch {
    return null;
  }
}

async function findIcnsPath(appPath) {
  const resourcesDir = path.join(appPath, 'Contents', 'Resources');
  const infoPlist = path.join(appPath, 'Contents', 'Info.plist');

  // Preferred: CFBundleIconFile from Info.plist
  let iconFile = null;
  try {
    const { stdout } = await execFileP('plutil', ['-extract', 'CFBundleIconFile', 'raw', infoPlist]);
    iconFile = stdout.trim();
  } catch {
    // key absent — fall back to directory scan
  }

  if (iconFile) {
    const withExt = iconFile.endsWith('.icns') ? iconFile : `${iconFile}.icns`;
    const candidate = path.join(resourcesDir, withExt);
    if (fs.existsSync(candidate)) return candidate;
  }

  // Fallback: first .icns in Resources (prefer one containing "icon").
  try {
    const icns = fs.readdirSync(resourcesDir).filter(f => f.toLowerCase().endsWith('.icns'));
    if (!icns.length) return null;
    const preferred = icns.find(f => /icon/i.test(f)) || icns[0];
    return path.join(resourcesDir, preferred);
  } catch {
    return null;
  }
}

/**
 * Get a cached official icon path for a brand at a given size.
 * Priority:
 *   1. local macOS .app bundle (most authoritative)
 *   2. bundled local icon (web/public/icons/<localIconBase>-{size}.png) — no network
 *   3. registered remote icon URL, downloaded once and cached locally
 * @param {string} brand
 * @param {number} [size=64]
 * @returns {Promise<string|null>}
 */
export async function getIconForBrand(brand, size = 64) {
  const sz = clampSize(size);
  const canonical = normalizeBrandKey(brand);
  const lookupKey = canonical || String(brand || '').trim();
  const cacheBrand = canonical || lookupKey.toLowerCase();
  if (!lookupKey) return null;

  const key = `${cacheBrand}:${sz}`;
  if (iconPathCache.has(key)) {
    const cached = iconPathCache.get(key);
    if (cached && fs.existsSync(cached)) return cached;
    if (cached === null) return null;
  }

  const spec = resolveBrandSpec(lookupKey);
  if (!spec) {
    iconPathCache.set(key, null);
    return null;
  }

  const appPath = await locateApp(lookupKey);
  if (appPath) {
    const png = await extractIconPng(appPath, sz);
    if (png) {
      iconPathCache.set(key, png);
      return png;
    }
  }

  // Bundled local fallback (offline-safe, no network).
  const localIcon = resolveLocalIcon(spec, sz);
  if (localIcon) {
    iconPathCache.set(key, localIcon);
    return localIcon;
  }

  const remoteCached = readRemoteCache(cacheBrand);
  if (remoteCached) {
    iconPathCache.set(key, remoteCached);
    return remoteCached;
  }

  const remote = await downloadOfficialIcon(cacheBrand, spec);
  iconPathCache.set(key, remote);
  return remote;
}

/**
 * Locate a bundled local icon for the spec.
 * Convention: <repo>/packages/web/public/<localIconBase>-<size>.<ext>
 * Falls back across 32/64/128 if the requested size is missing.
 * @param {object} spec
 * @param {number} size
 * @returns {string|null}
 */
function resolveLocalIcon(spec, size) {
  const base = spec?.localIconBase;
  if (!base) return null;
  const dirCandidates = locateWebPublicDirs();
  const candidates = [size, 128, 64, 32, 192, 512];
  const extensions = ['.png', '.svg', '.ico'];
  for (const dir of dirCandidates) {
    for (const c of candidates) {
      for (const ext of extensions) {
        const abs = path.join(dir, `${base}-${c}${ext}`);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
      }
    }
  }
  return null;
}

let _webPublicDirs = null;
function locateWebPublicDirs() {
  if (_webPublicDirs) return _webPublicDirs;
  const candidates = [];
  const cwd = process.cwd();
  // dev: repo root or packages/web cwd
  for (const p of [
    path.join(cwd, 'packages', 'web', 'public'),
    path.join(cwd, '..', 'packages', 'web', 'public'),
    path.join(cwd, '..', '..', 'packages', 'web', 'public'),
    path.join(cwd, 'public'),
    path.join(cwd, '..', 'public'),
  ]) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) candidates.push(p);
  }
  // packaged: scanner sits in packages/scanner/src/icon, icons live in packages/web/public
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.resolve(here, '..', '..', '..', 'web', 'public'));
  } catch {}
  _webPublicDirs = candidates;
  return _webPublicDirs;
}

/**
 * Decide the icon reference for a skill WITHOUT touching the filesystem/spawns.
 * Implements the R6.5 priority chain:
 *   explicit frontmatter.icon > official icon endpoint (brand/source) > neutral UI placeholder
 *
 * @param {object} skill
 * @param {string} [skill.icon]    — explicit frontmatter icon ("emoji:🤖"/"url:.."/"app:bundleId")
 * @param {string} [skill.brand]
 * @param {string} [skill.source]
 * @param {number} [size=64]
 * @returns {{ iconUrl?: string, iconFallback?: string }}
 */
export function resolveIconRef(skill, size = 64) {
  const sz = clampSize(size);
  const icon = skill?.icon ? String(skill.icon).trim() : '';

  // 1. Explicit frontmatter override
  if (icon) {
    if (icon.startsWith('emoji:')) return { iconFallback: icon.slice(6) };
    if (icon.startsWith('url:')) return { iconUrl: icon.slice(4) };
    if (icon.startsWith('app:')) {
      const key = normalizeBrandKey(icon.slice(4)) || icon.slice(4);
      return { iconUrl: `/api/icons/${encodeURIComponent(key)}?size=${sz}` };
    }
    // A bare emoji / single glyph
    return { iconFallback: icon };
  }

  // 2. Official icon endpoint by brand, then source
  for (const rawKey of [skill?.brand, skill?.source]) {
    const key = normalizeBrandKey(rawKey);
    if (key && resolveBrandSpec(key)) {
      return { iconUrl: `/api/icons/${encodeURIComponent(key)}?size=${sz}` };
    }
  }

  // 3. No mapping — frontend renders a neutral placeholder
  return {};
}

export { IS_MACOS };
