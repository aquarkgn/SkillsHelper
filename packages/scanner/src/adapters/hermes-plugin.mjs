// Hermes plugin adapter — catalogs local plugin manifests and READMEs.
// It never imports or executes plugin code.

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import YAML from 'yaml';
import {
  classifyRoot,
  deriveDescription,
  expandRoots,
  inferBrand,
  inferProduct,
  makePreview,
  readFileSafe,
  sha1Id,
} from '../utils.mjs';

const MANIFEST_NAMES = ['plugin.yaml', 'plugin.yml', 'plugin.json', 'manifest.json', 'package.json'];
const README_NAMES = ['README.md', 'readme.md'];

export async function scanHermesPlugins(opts) {
  const {
    source = 'hermes-plugin',
    editor = 'Hermes Agent',
    roots = [],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const expanded = await expandRoots(roots || []);
  const pluginDirs = new Set();
  for (const root of expanded) {
    if (!fs.existsSync(root)) continue;
    const found = await fg(['*/plugin.{yaml,yml,json}', '*/manifest.json', '*/package.json', '*/README.md', '*/readme.md'], {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      dot: true,
      followSymbolicLinks: false,
      deep: 2,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    });
    for (const f of found) pluginDirs.add(path.dirname(f));
  }

  const items = [];
  for (const dir of pluginDirs) {
    items.push(parsePluginDir({ dir, source, editor, limits }));
    if (items.length >= limits.maxFiles) break;
  }
  return { items, stats: { source, available: true, files: items.length, roots: expanded } };
}

function parsePluginDir({ dir, source, editor, limits }) {
  const manifestPath = firstExisting(dir, MANIFEST_NAMES);
  const readmePath = firstExisting(dir, README_NAMES);
  const rawParts = [];
  let manifest = {};
  let parseError;
  let mtime = new Date(0);

  if (manifestPath) {
    const r = readFileSafe(manifestPath, limits.maxFileBytes);
    mtime = r.mtime || mtime;
    if (!r.error && !r.truncated) {
      rawParts.push(`# ${path.basename(manifestPath)}\n\n${r.text}`);
      const parsed = parseManifest(manifestPath, r.text);
      if (parsed.ok) manifest = parsed.value;
      else parseError = parsed.error;
    } else {
      parseError = r.error || 'manifest too large';
    }
  }

  let readmeBody = '';
  if (readmePath) {
    const r = readFileSafe(readmePath, limits.maxFileBytes);
    if (r.mtime > mtime) mtime = r.mtime;
    if (!r.error && !r.truncated) {
      readmeBody = r.text;
      rawParts.push(`# ${path.basename(readmePath)}\n\n${r.text}`);
    }
  }

  const dirName = path.basename(dir);
  const name = String(manifest.name || manifest.title || dirName).trim();
  const description = typeof manifest.description === 'string'
    ? manifest.description.trim()
    : deriveDescription({}, readmeBody || rawParts.join('\n\n'));
  const raw = rawParts.join('\n\n---\n\n');
  const item = {
    id: sha1Id(dir),
    kind: 'plugin',
    source,
    editor,
    name,
    title: manifest.title && manifest.title !== name ? manifest.title : undefined,
    description,
    category: 'plugin',
    product: inferProduct({ name, category: 'plugin' }),
    tags: collectTags(manifest),
    paths: { abs: dir, rel: dirName, rootKind: classifyRoot(dir) },
    preview: makePreview(raw || description || '', 600),
    raw,
    links: collectLinks(manifest),
    updatedAt: new Date(mtime).toISOString(),
  };
  item.brand = inferBrand({ name: item.name, description: item.description, category: item.category, raw });
  if (!item.tags?.length) delete item.tags;
  if (!item.links?.length) delete item.links;
  if (parseError) item.parseError = parseError;
  return item;
}

function firstExisting(dir, names) {
  for (const name of names) {
    const f = path.join(dir, name);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return undefined;
}

function parseManifest(abs, text) {
  try {
    if (/\.json$/i.test(abs)) return { ok: true, value: JSON.parse(text) || {} };
    return { ok: true, value: YAML.parse(text) || {} };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function collectTags(obj) {
  const candidates = [obj.tags, obj.keywords, obj.categories];
  const out = [];
  for (const v of candidates) {
    if (Array.isArray(v)) out.push(...v.filter(x => typeof x === 'string'));
    else if (typeof v === 'string') out.push(...v.split(',').map(x => x.trim()).filter(Boolean));
  }
  return [...new Set(out)];
}

function collectLinks(obj) {
  const out = [];
  for (const [label, value] of Object.entries({ homepage: obj.homepage, repository: obj.repository, url: obj.url })) {
    if (typeof value === 'string') out.push({ label, url: value });
    else if (value && typeof value.url === 'string') out.push({ label, url: value.url });
  }
  return out;
}
