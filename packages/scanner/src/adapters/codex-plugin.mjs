// Codex plugin adapter — catalog local plugin manifests without executing code.

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

const MANIFEST_GLOB = '**/.codex-plugin/plugin.json';
const IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.venv/**'];

export async function scanCodexPlugins(opts = {}) {
  const {
    source = 'codex-plugin',
    editor = 'Codex',
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
      description: 'Codex 插件清单解析失败',
      parseError: `invalid plugin.json: ${error.message}`,
    });
  }

  const interfaceInfo = asObject(manifest.interface);
  const name = stringValue(manifest.name) || path.basename(pluginDir);
  const title = stringValue(interfaceInfo.displayName) || name;
  const description = stringValue(interfaceInfo.shortDescription)
    || stringValue(manifest.description)
    || stringValue(interfaceInfo.longDescription)
    || '未提供插件说明';
  const longDescription = stringValue(interfaceInfo.longDescription) || stringValue(manifest.description);
  const category = stringValue(interfaceInfo.category);
  const author = stringValue(asObject(manifest.author).name) || stringValue(interfaceInfo.developerName);
  const homepage = firstSafeUrl(manifest.homepage, manifest.repository, interfaceInfo.websiteURL);
  const capabilities = collectCapabilities({ manifest, interfaceInfo, pluginDir });
  const defaultPrompts = stringArray(interfaceInfo.defaultPrompt).slice(0, 3);
  const logoPath = resolveAssetPath(pluginDir, interfaceInfo.logo || interfaceInfo.composerIcon);
  const tags = uniqueStrings([...stringArray(manifest.keywords), category].filter(Boolean));

  const raw = renderPluginRaw({
    title,
    description: longDescription || description,
    version: stringValue(manifest.version),
    author,
    category,
    capabilities,
    defaultPrompts,
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
    preview: makePreview(longDescription || description, 600),
    links: homepage ? [{ label: '官网', url: homepage }] : undefined,
    plugin: {
      manifestPath,
      version: stringValue(manifest.version),
      author,
      homepage,
      category,
      capabilities,
      defaultPrompts: defaultPrompts.length ? defaultPrompts : undefined,
      logoPath,
    },
  });
  item.brand = 'codex';
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
  preview = '',
  links,
  plugin,
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
    preview,
    raw,
    links,
    plugin: plugin || { manifestPath, capabilities: [] },
    updatedAt: new Date(mtime || 0).toISOString(),
  };
  if (parseError) item.parseError = parseError;
  return item;
}

function collectCapabilities({ manifest, interfaceInfo, pluginDir }) {
  const capabilities = [];
  const skillPath = resolveAssetPath(pluginDir, manifest.skills);
  if (skillPath && fs.existsSync(skillPath)) {
    capabilities.push({ kind: 'skill', label: 'skills', count: countSkillFiles(skillPath) });
  }

  const mcpValue = manifest.mcpServers;
  if (mcpValue) {
    capabilities.push({ kind: 'mcp', label: 'mcpServers', count: objectSize(mcpValue) || undefined });
  }

  const appValue = manifest.apps;
  if (appValue) {
    capabilities.push({ kind: 'app', label: 'apps', count: objectSize(appValue) || undefined });
  }

  for (const capability of stringArray(interfaceInfo.capabilities)) {
    const kind = normalizeInterfaceCapability(capability);
    if (kind) capabilities.push({ kind, label: capability });
  }
  return uniqueCapabilities(capabilities);
}

function countSkillFiles(skillPath) {
  try {
    const stat = fs.statSync(skillPath);
    if (!stat.isDirectory()) return 1;
    return fg.sync(['**/SKILL.md', '**/skill.md'], {
      cwd: skillPath,
      onlyFiles: true,
      dot: true,
      followSymbolicLinks: false,
      ignore: IGNORE,
    }).length;
  } catch {
    return undefined;
  }
}

function normalizeInterfaceCapability(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'interactive') return 'interactive';
  if (normalized === 'write') return 'write';
  return undefined;
}

function uniqueCapabilities(capabilities) {
  const byKind = new Map();
  for (const capability of capabilities) {
    const current = byKind.get(capability.kind);
    if (!current || (capability.count || 0) > (current.count || 0)) byKind.set(capability.kind, capability);
  }
  return [...byKind.values()];
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

function renderPluginRaw({ title, description, version, author, category, capabilities, defaultPrompts }) {
  const lines = [`# ${title}`, '', description];
  if (version) lines.push('', `版本：${version}`);
  if (author) lines.push(`开发者：${author}`);
  if (category) lines.push(`分类：${category}`);
  if (capabilities.length) {
    lines.push('', '## 插件能力', '');
    for (const capability of capabilities) {
      lines.push(`- ${capability.label}${capability.count ? ` (${capability.count})` : ''}`);
    }
  }
  if (defaultPrompts.length) {
    lines.push('', '## 示例提示词', '');
    for (const prompt of defaultPrompts) lines.push(`- ${prompt}`);
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

function objectSize(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length : 0;
}

function resolveAssetPath(pluginDir, value) {
  if (!stringValue(value)) return undefined;
  const candidate = path.resolve(pluginDir, value);
  return candidate.startsWith(pluginDir + path.sep) || candidate === pluginDir ? candidate : undefined;
}

function firstSafeUrl(...values) {
  for (const value of values) {
    const url = stringValue(value);
    if (url && /^https?:\/\//i.test(url)) return url;
  }
  return undefined;
}

function uniqueStrings(values) {
  return [...new Set(values)];
}
