// Claude Code plugin adapter — catalog local plugin manifests without executing code.
// Plugin manifest lives at <plugin-dir>/.claude-plugin/plugin.json (Anthropic convention).

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import {
  classifyRoot,
  expandRoots,
  makePreview,
  readFileSafe,
  sha1Id,
} from '../utils.mjs';

const MANIFEST_GLOB = '**/.claude-plugin/plugin.json';
const IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.venv/**'];

export async function scanClaudePlugins(opts = {}) {
  const {
    source = 'claude-plugin',
    editor = 'Claude Code',
    roots = [],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const expandedRoots = await expandRoots(roots);
  if (!expandedRoots.length) {
    return { items: [], stats: { source, available: false, files: 0, roots: [] } };
  }

  const manifests = [];
  for (const root of expandedRoots) {
    const found = await fg(MANIFEST_GLOB, {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      dot: true,
      followSymbolicLinks: false,
      ignore: IGNORE,
    });
    for (const manifestPath of found) {
      manifests.push({ manifestPath, root });
      if (manifests.length >= limits.maxFiles) break;
    }
    if (manifests.length >= limits.maxFiles) break;
  }

  const parsed = manifests.map((entry) => parsePluginManifest({ ...entry, source, editor, limits }));
  const items = dedupePluginVersions(parsed);
  return {
    items,
    stats: { source, available: true, files: items.length, roots: expandedRoots },
  };
}

function parsePluginManifest({ manifestPath, root, source, editor, limits }) {
  const pluginDir = path.dirname(path.dirname(manifestPath));
  const rel = path.relative(root, pluginDir);
  const id = sha1Id(pluginDir);
  const read = readFileSafe(manifestPath, limits.maxFileBytes);

  if (read.error || read.truncated) {
    return baseItem({
      id,
      source,
      editor,
      pluginDir,
      rel,
      manifestPath,
      mtime: read.mtime,
      name: path.basename(pluginDir),
      description: read.error || `manifest > ${limits.maxFileBytes} bytes, skipped`,
      parseError: read.error || 'manifest too large',
    });
  }

  let manifest;
  try {
    manifest = JSON.parse(read.text);
  } catch (error) {
    return baseItem({
      id,
      source,
      editor,
      pluginDir,
      rel,
      manifestPath,
      mtime: read.mtime,
      name: path.basename(pluginDir),
      description: 'Claude 插件清单解析失败',
      parseError: `invalid plugin.json: ${error.message}`,
    });
  }

  const authorInfo = asObject(manifest.author);
  const name = stringValue(manifest.name) || path.basename(pluginDir);
  const title = stringValue(manifest.displayName) || stringValue(manifest.title) || name;
  const description = stringValue(manifest.description) || '未提供插件说明';
  const longDescription = stringValue(manifest.description);
  const category = stringValue(manifest.category);
  const author = stringValue(authorInfo.name)
    || stringValue(typeof manifest.author === 'string' ? manifest.author : undefined);
  const homepage = firstSafeUrl(manifest.homepage, manifest.repository);
  const keywords = stringArray(manifest.keywords);
  const tags = uniqueStrings([...keywords, category].filter(Boolean));
  const components = uniqueComponents(collectComponents(manifest));

  const raw = renderPluginRaw({
    title,
    description: longDescription,
    version: stringValue(manifest.version),
    author,
    category,
    components,
  });

  const item = baseItem({
    id,
    source,
    editor,
    pluginDir,
    rel,
    manifestPath,
    mtime: read.mtime,
    name,
    title,
    description,
    category,
    tags,
    raw,
    links: homepage ? [{ label: '官网', url: homepage }] : undefined,
  });
  item.brand = 'claude';
  item.editorBrand = 'claude';
  return item;
}

function baseItem({
  id,
  source,
  editor,
  pluginDir,
  rel,
  manifestPath,
  mtime,
  name,
  title,
  description,
  category,
  tags,
  raw = '',
  links,
  parseError,
}) {
  const item = {
    id,
    kind: 'plugin',
    source,
    editor,
    name,
    title: title && title !== name ? title : undefined,
    description,
    category,
    tags: tags?.length ? tags : undefined,
    paths: { abs: pluginDir, rel, rootKind: classifyRoot(pluginDir) },
    preview: makePreview(raw, 600),
    raw,
    links,
    plugin: { manifestPath, capabilities: [] },
    updatedAt: new Date(mtime || 0).toISOString(),
  };
  if (parseError) item.parseError = parseError;
  return item;
}

function collectComponents(manifest) {
  const present = [];
  const hasDir = (value) => stringArray(value).length > 0;
  if (hasDir(manifest.agents)) present.push('agents');
  if (hasDir(manifest.skills)) present.push('skills');
  if (hasDir(manifest.commands)) present.push('commands');
  if (hasDir(manifest.hooks)) present.push('hooks');
  if (manifest.mcpServers) present.push('mcp');
  if (manifest.lspServers) present.push('lsp');
  return present;
}

function uniqueComponents(items) {
  return [...new Set(items)];
}

function dedupePluginVersions(items) {
  const byPlugin = new Map();
  for (const item of items) {
    const key = `${item.name.toLowerCase()}\u0000${pluginOrigin(item.paths.abs)}`;
    const current = byPlugin.get(key);
    if (!current || comparePluginItems(item, current) > 0) byPlugin.set(key, item);
  }
  return [...byPlugin.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function pluginOrigin(pluginDir) {
  const cacheIndex = pluginDir.indexOf('/cache/');
  if (cacheIndex === -1) return path.dirname(pluginDir);
  return pluginDir.slice(cacheIndex + '/cache/'.length).split('/').slice(0, -2).join('/');
}

function comparePluginItems(a, b) {
  const versionCompare = compareVersions(a.plugin?.version, b.plugin?.version);
  if (versionCompare !== 0) return versionCompare;
  return Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
}

function compareVersions(a = '', b = '') {
  const aParts = a.split(/[^0-9]+/).filter(Boolean).map(Number);
  const bParts = b.split(/[^0-9]+/).filter(Boolean).map(Number);
  const max = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < max; index += 1) {
    const diff = (aParts[index] || 0) - (bParts[index] || 0);
    if (diff) return diff;
  }
  return a.localeCompare(b);
}

function renderPluginRaw({ title, description, version, author, category, components }) {
  const lines = [`# ${title}`, '', description || '未提供插件说明'];
  if (version) lines.push('', `版本：${version}`);
  if (author) lines.push(`作者：${author}`);
  if (category) lines.push(`分类：${category}`);
  if (components?.length) {
    lines.push('', '## 插件组件', '');
    for (const name of components) lines.push(`- ${name}`);
  }
  return lines.join('\n');
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  return stringValue(value) ? [value.trim()] : [];
}

function firstSafeUrl(...values) {
  for (const value of values) {
    const url = stringValue(typeof value === 'object' && value ? value.url : value);
    if (url && /^https?:\/\//i.test(url)) return url;
  }
  return undefined;
}

function uniqueStrings(values) {
  return [...new Set(values)];
}