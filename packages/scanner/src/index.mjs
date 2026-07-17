// @skillhelper/scanner — multi-source skill aggregator.
//
// P1 wires hermes + claude-code adapters via the shared markdown-skill
// scanner. Other adapters land in P4. The orchestrator loads sources.yaml
// from ~/.config/skillhelper/, dispatches to enabled adapters, and
// returns a flat IR list.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveSourceBrand } from './icon/brand-registry.mjs';
import YAML from 'yaml';
import { configFile } from '../../../bin/lib/paths.mjs';
import { scanMarkdownSkills } from './adapters/markdown-skill.mjs';
import { scanDirectorySkills } from './adapters/directory-skill.mjs';
import { scanFileDocs } from './adapters/file-docs.mjs';
import { scanMcpConfigs } from './adapters/mcp-config.mjs';
import { scanHermesPlugins } from './adapters/hermes-plugin.mjs';
import { scanCodexPlugins } from './adapters/codex-plugin.mjs';
import { scanClaudeAgents } from './adapters/claude-agents.mjs';
import { scanClaudePlugins } from './adapters/claude-plugin.mjs';
import { expandRoots, expandTilde } from './utils.mjs';
import { scanTierSkills } from './adapters/scan-tier.mjs';

const ADAPTERS = {
  // Tier 1: Tool adapters (return items with tier='tool', brand set)
  hermes: async (cfg, limits) => {
    const result = await scanMarkdownSkills({
      source: 'hermes',
      roots: cfg.roots || [],
      fileGlob: '**/SKILL.md',
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'hermes';
    });
    return result;
  },

  'claude-code': async (cfg, limits) => {
    const result = await scanMarkdownSkills({
      source: 'claude-code',
      roots: cfg.roots || [],
      fileGlob: '**/SKILL.md',
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'claude';
    });
    return result;
  },

  codex: async (cfg, limits) => {
    const result = await scanFileDocs({
      source: 'codex',
      editor: 'Codex',
      kind: 'instruction',
      files: cfg.files || [],
      roots: cfg.roots || [],
      globs: normalizeGlobs(cfg, ['AGENTS.md']),
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'codex';
    });
    return result;
  },

  cursor: async (cfg, limits) => {
    const result = await scanFileDocs({
      source: 'cursor',
      editor: 'Cursor',
      kind: 'instruction',
      files: cfg.files || [],
      roots: cfg.roots || [],
      globs: normalizeGlobs(cfg, ['.cursorrules', '.cursor/rules/**/*.{md,mdc}']),
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'cursor';
    });
    return result;
  },

  'hermes-plugin': async (cfg, limits) => {
    const result = await scanHermesPlugins({
      source: 'hermes-plugin',
      editor: 'Hermes Agent',
      roots: cfg.roots || [],
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'hermes';
    });
    return result;
  },

  'codex-plugin': async (cfg, limits) => {
    const result = await scanCodexPlugins({
      source: 'codex-plugin',
      editor: 'Codex',
      roots: cfg.roots || [],
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
      it.brand = 'codex';
    });
    return result;
  },

  'claude-agents': async (cfg, limits) => {
    const result = await scanClaudeAgents({
      source: 'claude-agents',
      editor: 'Claude Code',
      roots: cfg.roots || [],
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
    });
    return result;
  },

  'claude-plugin': async (cfg, limits) => {
    const result = await scanClaudePlugins({
      source: 'claude-plugin',
      editor: 'Claude Code',
      roots: cfg.roots || [],
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'tool';
    });
    return result;
  },

  // Tier 2: Directory-based skills (already returns tier='directory', dirName)
  'directory-skill': async (cfg, limits) => scanDirectorySkills({
    paths: cfg.paths || [],
    globs: normalizeGlobs(cfg, ['**/SKILL.md']),
    limits,
  }),

  // Tier 3: Other sources (assign tier='other')
  'project-runbook': async (cfg, limits) => {
    const result = await scanFileDocs({
      source: 'project-runbook',
      editor: 'Project Docs',
      kind: 'runbook',
      files: cfg.files || [],
      roots: cfg.roots || [],
      globs: normalizeGlobs(cfg, ['docs/RUNBOOK-*.md', 'AGENTS.md', 'CLAUDE.md', '.cursorrules', '.cursor/rules/**/*.{md,mdc}']),
      limits,
    });
    result.items.forEach(it => {
      it.tier = 'other';
    });
    return result;
  },

  // Removed: 'mcp-config', 'mcp', 'skills', 'skill' — no longer scanned
  // Future: obsidian
};

const DEFAULT_CODEX_PLUGIN_SOURCE = Object.freeze({
  enabled: true,
  roots: ['~/.codex/plugins/cache'],
});

const DEFAULT_CLAUDE_AGENTS_SOURCE = Object.freeze({
  enabled: true,
  roots: ['~/.claude/agents'],
});

const DEFAULT_CLAUDE_PLUGIN_SOURCE = Object.freeze({
  enabled: true,
  roots: ['~/.claude/plugins/cache'],
});

function codexPluginConfig(cfg) {
  return cfg.sources?.['codex-plugin'] ?? DEFAULT_CODEX_PLUGIN_SOURCE;
}

function claudeAgentsConfig(cfg) {
  return cfg.sources?.['claude-agents'] ?? DEFAULT_CLAUDE_AGENTS_SOURCE;
}

function claudePluginConfig(cfg) {
  return cfg.sources?.['claude-plugin'] ?? DEFAULT_CLAUDE_PLUGIN_SOURCE;
}

function normalizeGlobs(cfg, defaults) {
  if (Array.isArray(cfg.globs)) return cfg.globs.filter(Boolean);
  if (cfg.glob) return [cfg.glob].flat().filter(Boolean);
  return defaults;
}

/**
 * Run all enabled adapters and return a flat IR list.
 * v4.0: 使用三层优先级扫描器（Tier 1 编辑器 + Tier 2 用户 + Tier 3 其他）
 * @returns {Promise<import('./types').SkillItem[]>}
 */
export async function scan() {
  const cfg = loadConfig();
  if (!cfg) return [];

  const limits = {
    maxFiles: cfg.limits?.maxFiles ?? 5000,
    maxFileBytes: cfg.limits?.maxFileBytes ?? 1024 * 1024,
  };

  // ✅ v4.0: 调用三层优先级扫描器
  try {
    if (process.env.SKILLHELPER_DEBUG) {
      console.error('[scan] Calling scanTierSkills (Tier 1 → 2 → 3)...');
    }

    const tierResult = await scanTierSkills({
      scanTier1: cfg.scanTier1 !== false,
      scanTier2: cfg.scanTier2 !== false,
      scanTier3: cfg.scanTier3 === true,
      projectRoot: process.cwd(),
      limits,
    });

    if (process.env.SKILLHELPER_DEBUG) {
      console.error('[scan] tierResult stats:', JSON.stringify(tierResult.stats, null, 2));
    }

    // 三层扫描器可能产生同名重复（gstack 为 .cursor/.factory/.kiro 等多编辑器
    // 生成的副本，source/kind/name 全相同），用语义去重合并为一条，保留主文件。
    const items = [...(tierResult.items || [])];
    const pluginConfig = codexPluginConfig(cfg);
    if (pluginConfig.enabled) {
      try {
        const pluginResult = await ADAPTERS['codex-plugin'](pluginConfig, limits);
        items.push(...pluginResult.items.map(withLegacyMetadata));
      } catch (error) {
        // 插件扫描失败不能让既有 Tier 1-3 技能整体退回旧扫描路径。
        console.warn('[scan] Codex plugin scan failed:', error.message);
      }
    }

    const agentsConfig = claudeAgentsConfig(cfg);
    if (agentsConfig.enabled) {
      try {
        const agentsResult = await ADAPTERS['claude-agents'](agentsConfig, limits);
        items.push(...agentsResult.items.map(withLegacyMetadata));
      } catch (error) {
        console.warn('[scan] Claude agents scan failed:', error.message);
      }
    }

    const claudePluginConf = claudePluginConfig(cfg);
    if (claudePluginConf.enabled) {
      try {
        const claudePluginResult = await ADAPTERS['claude-plugin'](claudePluginConf, limits);
        items.push(...claudePluginResult.items.map(withLegacyMetadata));
      } catch (error) {
        console.warn('[scan] Claude plugin scan failed:', error.message);
      }
    }
    return dedupeSemantic(items);
  } catch (e) {
    console.warn('[scan] Three-tier scanner failed:', e.message);
    if (process.env.SKILLHELPER_DEBUG) {
      console.error('[scan] Error stack:', e.stack);
    }
    // 降级：如果三层扫描失败，使用旧的 adapter 模式
    console.error('[scan] Falling back to legacy adapters...');
    return scanLegacy(cfg, limits);
  }
}

/**
 * 降级方案：旧的 adapter 模式（当三层扫描失败时使用）
 * v4.0: 补上 pathHash 和 tier 字段，便于前端分层菜单显示
 *
 * export 供单元测试验证「sources.yaml 聚合 + 语义去重」逻辑：
 * scan() 主路径走三层扫描器（固定路径，不读 sources.yaml 的 hermes/codex/cursor 配置），
 * 只有 scanLegacy 通过 sources.yaml 聚合多 source。
 */
export async function scanLegacy(cfg, limits) {
  const all = [];
  const stats = [];
  for (const [name, src] of Object.entries(cfg.sources || {})) {
    if (!src?.enabled) continue;
    const fn = ADAPTERS[name];
    if (!fn) continue;
    try {
      const { items, stats: s } = await fn(src, limits);
      all.push(...items);
      stats.push(s);
    } catch (e) {
      stats.push({ source: name, available: false, error: e.message });
    }
  }

  const out = dedupeSemantic(all);

  if (process.env.SKILLHELPER_DEBUG) {
    console.error('[scan] legacy stats:', JSON.stringify(stats, null, 2));
  }

  // 补上 v4.0 必需字段：tier（必须）、pathHash（必须）、editorBrand（可选）
  // 注意：本文件是 ESM，crypto/path 已在顶部 import，不能用 require。
  return out.map(withLegacyMetadata);
}

function withLegacyMetadata(item) {
    // 计算 pathHash（如果有 filePath）
    let pathHash = '';
    if (item.paths?.abs) {
      const normalized = path.resolve(item.paths.abs);
      pathHash = crypto.createHash('md5').update(normalized).digest('hex');
    } else if (item.id) {
      pathHash = item.id; // 降级：用 id 作为 pathHash
    }

    // tierId 与 editorBrand 由分层扫描器明确给出时必须保留；brand 是技能内容
    // 主题（如 Airtable），不能覆盖所属编辑器品牌（如 Hermes）。
    let tier = item.tierId || 'tier-1';
    if (!item.tierId && item.tier === 'directory') tier = 'tier-2';
    if (!item.tierId && item.tier === 'other') tier = 'tier-3';

    const sourceBrand = resolveSourceBrand({
      sourceBrand: item.sourceBrand,
      editorBrand: item.editorBrand,
      editor: item.editor,
      source: item.source,
    });
    const editorBrand = sourceBrand || item.editorBrand;

    return {
      ...item,
      tier, // 'tier-1' | 'tier-2' | 'tier-3'
      pathHash, // MD5(filePath) 用于去重
      editorBrand, // 品牌名，用于 Tier1 分组和图标
      sourceBrand, // 来源/运行环境品牌；brand 仍是技能内容主题
    };
}

export async function getWatchTargets() {
  const cfg = loadConfig();
  const targets = new Set([configFile()]);
  if (!cfg) return [...targets];

  for (const [name, src] of Object.entries(cfg.sources || {})) {
    if (!src?.enabled) continue;
    for (const f of src.files || []) targets.add(expandTilde(f));

    // directory-skill uses 'paths' instead of 'roots'
    const roots = name === 'directory-skill'
      ? await expandRoots(src.paths || [])
      : await expandRoots(src.roots || []);

    const globs = normalizeGlobs(src, defaultWatchGlobs(name));
    for (const root of roots) {
      for (const g of globs) targets.add(`${root}/${g}`);
    }
  }

  // 旧版 sources.yaml 没有 codex-plugin 配置时也应立即识别本机插件。
  // 用户可显式写 enabled: false 关闭这条默认扫描路径。
  if (cfg.sources?.['codex-plugin'] === undefined) {
    const roots = await expandRoots(DEFAULT_CODEX_PLUGIN_SOURCE.roots);
    for (const root of roots) targets.add(`${root}/**/.codex-plugin/plugin.json`);
  }

  return [...targets];
}

function defaultWatchGlobs(name) {
  switch (name) {
    case 'hermes':
    case 'claude-code':
    case 'directory-skill':
      return ['**/SKILL.md'];
    case 'hermes-plugin':
      return ['**/{plugin.yaml,plugin.yml,plugin.json,manifest.json,package.json,README.md,readme.md}'];
    case 'codex-plugin':
      return ['**/.codex-plugin/plugin.json'];
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

export function loadConfig() {
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
