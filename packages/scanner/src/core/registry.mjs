/**
 * @file registry.mjs
 * 从 editor-tiers.mjs 现有配置派生 ScannerDescriptor 并注册。
 *
 * 设计原则：配置单一来源仍是 editor-tiers.mjs（现有测试直接引用其导出，
 * 不破坏）。registry 是派生层，adapter 改为从 registry 读 descriptor。
 *
 * 阶段一渐进迁移：本模块在 scanner 入口加载时调用 registerAll()，
 * 之后 tier1/2/3 adapter 用 getDescriptor(id) 替代硬编码。
 */

import {
  EDITOR_TIER_1_CONFIGS,
  USER_TIER_2_CONFIG,
  OTHER_TIER_3_CONFIGS,
} from '../config/editor-tiers.mjs';
import {
  registerDescriptors,
  listDescriptors,
  getDescriptor,
  descriptorsByTier,
} from './descriptor.mjs';

// 三个 tier 共用的 ignore 列表（从原 adapter 硬编码提取，保持一致）
const DEFAULT_IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**'];
const DEFAULT_DEEP = 10;

// glob 模式以相对形式存储（不含 basePath 前缀），adapter 拼接实际 basePath。
// 这样 globalPath 和 projectPath 扫描可复用同一组模式。

// Tier 1 的三种大小写不敏感 glob 模式（从 tier1-editor-skills.mjs:88-92 提取）
const TIER1_PATTERNS = [
  `**/[sS][kK][iI][lL][lL][sS]/**/[sS][kK][iI][lL][lL].[mM][dD]`,
  `**/SKILL.md`,
  `**/skill.md`,
];

// Tier 2 的两种模式（从 tier2-user-skills.mjs:37-40 提取）
const TIER2_PATTERNS = [
  `**/SKILL.md`,
  `**/skill.md`,
];

// Tier 3 仅小写 skill.md（从 tier3-other-skills.mjs:44 提取，有意的大小写敏感）
const TIER3_PATTERNS = [`**/skill.md`];

let initialized = false;

/**
 * 把 editor-tiers.mjs 三种配置转成统一 descriptor 并注册。
 * 幂等：重复调用不重复注册（同 id 覆盖）。
 */
export function registerAll() {
  const descs = [];

  // Tier 1: 22 个编辑器
  for (const editor of EDITOR_TIER_1_CONFIGS) {
    descs.push({
      id: `tier1:${editor.brand}`,
      tier: 'tier-1',
      brand: editor.brand,
      label: editor.name,
      editorName: editor.name,
      detect: {
        globalPath: editor.globalPath,
        projectPath: editor.projectPath,
        globPatterns: TIER1_PATTERNS,
        ignore: DEFAULT_IGNORE,
        deep: DEFAULT_DEEP,
      },
    });
  }

  // Tier 2: 用户根目录技能库（单个）
  descs.push({
    id: 'tier2:user-skills',
    tier: 'tier-2',
    brand: 'my-skills',
    label: USER_TIER_2_CONFIG.name,
    editorName: 'my-skills',
    sourceTag: 'tier2-user',
    detect: {
      globalPath: USER_TIER_2_CONFIG.globalPath,
      globPatterns: TIER2_PATTERNS,
      ignore: DEFAULT_IGNORE,
      deep: DEFAULT_DEEP,
    },
  });

  // Tier 3: 其他位置（多个，每个一个 descriptor）
  for (const location of OTHER_TIER_3_CONFIGS) {
    descs.push({
      id: `tier3:${location.name}`,
      tier: 'tier-3',
      brand: 'other-skills',
      label: location.name,
      editorName: 'other-skills',
      sourceTag: 'tier3-other',
      detect: {
        globalPath: location.path,
        globPatterns: TIER3_PATTERNS,
        ignore: DEFAULT_IGNORE,
        deep: DEFAULT_DEEP,
      },
    });
  }

  registerDescriptors(descs);
  initialized = true;
}

/** 确保 registry 已初始化（懒加载，首次访问时触发） */
export function ensureRegistered() {
  if (!initialized) registerAll();
}

/** 重新加载（测试用：config 改动后强制重建） */
export function reload() {
  initialized = false;
  registerAll();
}

/** 重置 registry 与初始化标志（仅测试用，配合 descriptor._resetForTest） */
export function _resetForTest() {
  initialized = false;
}

export { listDescriptors, getDescriptor, descriptorsByTier };
