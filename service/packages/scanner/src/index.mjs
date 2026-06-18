// @huhaa/scanner — multi-source skill aggregator.
//
// P1 wires hermes + claude-code adapters via the shared markdown-skill
// scanner. Other adapters land in P4. The orchestrator loads sources.yaml
// from ~/.config/huhaa-myskills/, dispatches to enabled adapters, and
// returns a flat IR list.

import fs from 'node:fs';
import YAML from 'yaml';
import { configFile } from '../../../bin/lib/paths.mjs';
import { scanMarkdownSkills } from './adapters/markdown-skill.mjs';
import { scanFileDocs } from './adapters/file-docs.mjs';
import { scanMcpConfigs } from './adapters/mcp-config.mjs';
import { scanHermesPlugins } from './adapters/hermes-plugin.mjs';
import { expandRoots, expandTilde } from './utils.mjs';

const ADAPTERS = {
  hermes: async (cfg, limits) => scanMarkdownSkills({
    source: 'hermes',
    roots: cfg.roots || [],
    fileGlob: '**/SKILL.md',
    limits,
  }),
  'claude-code': async (cfg, limits) => scanMarkdownSkills({
    source: 'claude-code',
    roots: cfg.roots || [],
    fileGlob: '**/SKILL.md',
    limits,
  }),
  codex: async (cfg, limits) => scanFileDocs({
    source: 'codex',
    editor: 'Codex',
    kind: 'instruction',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['AGENTS.md']),
    limits,
  }),
  cursor: async (cfg, limits) => scanFileDocs({
    source: 'cursor',
    editor: 'Cursor',
    kind: 'instruction',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['.cursorrules', '.cursor/rules/**/*.{md,mdc}']),
    limits,
  }),
  'mcp-config': async (cfg, limits) => scanMcpConfigs({
    source: 'mcp-config',
    editor: 'MCP',
    files: cfg.files || [],
    limits,
  }),
  'hermes-plugin': async (cfg, limits) => scanHermesPlugins({
    source: 'hermes-plugin',
    editor: 'Hermes Agent',
    roots: cfg.roots || [],
    limits,
  }),
  'project-runbook': async (cfg, limits) => scanFileDocs({
    source: 'project-runbook',
    editor: 'Project Docs',
    kind: 'runbook',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['docs/RUNBOOK-*.md', 'AGENTS.md', 'CLAUDE.md', '.cursorrules', '.cursor/rules/**/*.{md,mdc}']),
    limits,
  }),
  'skills': async (cfg, limits) => scanFileDocs({
    source: 'skills',
    editor: 'Skills Hub',
    kind: 'skill',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['*.md', '*/SKILL.md', '**/SKILL.md']),
    limits,
  }),
  'mcp': async (cfg, limits) => scanFileDocs({
    source: 'mcp',
    editor: 'MCP Hub',
    kind: 'mcp-tool',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['*.md', '*.json', '*.yaml', '*.yml', '**/manifest.*']),
    limits,
  }),
  'skill': async (cfg, limits) => scanFileDocs({
    source: 'skill',
    editor: 'Skill Hub',
    kind: 'skill',
    files: cfg.files || [],
    roots: cfg.roots || [],
    globs: normalizeGlobs(cfg, ['*.md', '*/SKILL.md', '**/SKILL.md']),
    limits,
  }),
  // Future: obsidian
};

function normalizeGlobs(cfg, defaults) {
  if (Array.isArray(cfg.globs)) return cfg.globs.filter(Boolean);
  if (cfg.glob) return [cfg.glob].flat().filter(Boolean);
  return defaults;
}

/**
 * Run all enabled adapters and return a flat IR list.
 * @returns {Promise<import('./types').SkillItem[]>}
 */
export async function scan() {
  const cfg = loadConfig();
  if (!cfg) return [];

  const limits = {
    maxFiles: cfg.limits?.maxFiles ?? 5000,
    maxFileBytes: cfg.limits?.maxFileBytes ?? 1024 * 1024,
  };

  const all = [];
  const stats = [];
  for (const [name, src] of Object.entries(cfg.sources || {})) {
    if (!src?.enabled) continue;
    const fn = ADAPTERS[name];
    if (!fn) continue; // unknown adapter (e.g. mcp-config in P1) — skip silently
    try {
      const { items, stats: s } = await fn(src, limits);
      all.push(...items);
      stats.push(s);
    } catch (e) {
      stats.push({ source: name, available: false, error: e.message });
    }
  }

  const out = dedupeSemantic(all);

  if (process.env.HUHAA_DEBUG) {
    console.error('[scan] stats:', JSON.stringify(stats, null, 2));
  }
  return out;
}

export async function getWatchTargets() {
  const cfg = loadConfig();
  const targets = new Set([configFile()]);
  if (!cfg) return [...targets];

  for (const [name, src] of Object.entries(cfg.sources || {})) {
    if (!src?.enabled) continue;
    for (const f of src.files || []) targets.add(expandTilde(f));

    const roots = await expandRoots(src.roots || []);
    const globs = normalizeGlobs(src, defaultWatchGlobs(name));
    for (const root of roots) {
      for (const g of globs) targets.add(`${root}/${g}`);
    }
  }

  return [...targets];
}

function defaultWatchGlobs(name) {
  switch (name) {
    case 'hermes':
    case 'claude-code':
      return ['**/SKILL.md'];
    case 'skills':
    case 'skill':
      return ['*.md', '*/SKILL.md', '**/SKILL.md'];
    case 'mcp':
      return ['*.md', '*.json', '*.yaml', '*.yml', '**/manifest.*'];
    case 'hermes-plugin':
      return ['**/{plugin.yaml,plugin.yml,plugin.json,manifest.json,package.json,README.md,readme.md}'];
    case 'project-runbook':
      return ['docs/RUNBOOK-*.md', 'AGENTS.md', 'CLAUDE.md', '.cursorrules', '.cursor/rules/**/*.{md,mdc}'];
    case 'cursor':
      return ['rules/**/*.{md,mdc}', '.cursorrules'];
    case 'codex':
      return ['AGENTS.md'];
    default:
      return ['**/*'];
  }
}

function dedupeSemantic(items) {
  // First remove exact same id defensively.
  const byId = new Map();
  for (const it of items) if (!byId.has(it.id)) byId.set(it.id, it);

  // Then collapse repeated exports of the same semantic skill.
  // gstack publishes the same skill into multiple hidden tool namespaces:
  // .agents/.cursor/.factory/.gbrain/.hermes/.kiro/.opencode/.openclaw/...
  // Those are useful as provenance, but noisy as separate entries in this hub.
  const bySemantic = new Map();
  for (const it of byId.values()) {
    const key = `${it.source}:${it.kind}:${it.name}`;
    const current = bySemantic.get(key);
    if (!current || rankItem(it) > rankItem(current)) bySemantic.set(key, it);
  }

  return [...bySemantic.values()].sort((a, b) => {
    const sa = `${a.source}\u0000${a.category || ''}\u0000${a.name}`;
    const sb = `${b.source}\u0000${b.category || ''}\u0000${b.name}`;
    return sa.localeCompare(sb);
  });
}

function rankItem(it) {
  const p = it.paths?.abs || '';
  const parts = p.split('/').filter(Boolean);
  const parent = parts.at(-2) || '';
  const hiddenSegments = parts.filter(x => x.startsWith('.')).length;
  let score = 0;
  if (hiddenSegments === 0) score += 1000;
  if (parent === it.name) score += 400;
  if (it.description) score += 80;
  if (it.triggers?.length) score += 60;
  if (it.raw) score += Math.min(50, Math.floor(it.raw.length / 1000));
  score -= hiddenSegments * 50;
  score -= Math.min(200, p.length / 10);
  return score;
}

function loadConfig() {
  const f = configFile();
  if (!fs.existsSync(f)) return null;
  try {
    const text = fs.readFileSync(f, 'utf8');
    return YAML.parse(text) || {};
  } catch (e) {
    console.error(`[scan] sources.yaml parse error: ${e.message}`);
    return null;
  }
}

export { configFile };
