/**
 * @file scan-tier.mjs
 * v4.0 三层优先级扫描器
 * 集成 Tier 1（编辑器工具）+ Tier 2（用户根目录）+ Tier 3（其他）
 */

import { scanTier1EditorSkills } from './tier1-editor-skills.mjs';
import { scanTier2UserSkills } from './tier2-user-skills.mjs';
import { scanTier3OtherSkills } from './tier3-other-skills.mjs';
import { pathHashCache } from '../hash/path-hash.mjs';

/**
 * 三层优先级扫描
 *
 * @param {Object} options
 * @param {boolean} [options.scanTier1=true] - 是否扫描第1层（编辑器工具）
 * @param {boolean} [options.scanTier2=true] - 是否扫描第2层（用户根目录）
 * @param {boolean} [options.scanTier3=false] - 是否扫描第3层（其他位置）
 * @param {string} [options.projectRoot] - 项目根目录（用于扫描 .hermes/skills 等）
 * @param {Object} [options.limits] - { maxFiles, maxFileBytes }
 * @returns {Promise<{items: SkillItem[], stats: Object}>}
 */
export async function scanTierSkills(options = {}) {
  const {
    scanTier1 = true,
    scanTier2 = true,
    scanTier3 = false,
    projectRoot = process.cwd(),
    limits = {}
  } = options;

  const mergedLimits = {
    maxFiles: limits.maxFiles ?? 5000,
    maxFileBytes: limits.maxFileBytes ?? 1024 * 1024,
  };

  // Step 1: 扫描第1层
  console.error('[scan] Tier 1: scanning editor tools...');
  const tier1Result = await scanTier1EditorSkills({ projectRoot, limits: mergedLimits });
  const tier1Items = tier1Result.items;
  const tier1PathHashes = tier1Result.pathHashes;
  console.error(`[scan] Tier 1: found ${tier1Items.length} skills`);

  // Step 2: 扫描第2层（排除第1层已有的）
  console.error('[scan] Tier 2: scanning user skills library...');
  const tier2Result = await scanTier2UserSkills({
    tier1PathHashes,
    limits: mergedLimits,
  });
  const tier2Items = tier2Result.items;
  const tier2PathHashes = tier2Result.pathHashes;
  console.error(`[scan] Tier 2: found ${tier2Items.length} skills`);

  // Step 3: 扫描第3层（如果启用，排除第1、2层已有的）
  let tier3Items = [];
  if (scanTier3) {
    console.error('[scan] Tier 3: scanning other locations...');
    const tier3Result = await scanTier3OtherSkills({
      tier1PathHashes,
      tier2PathHashes,
      limits: mergedLimits,
    });
    tier3Items = tier3Result.items;
    console.error(`[scan] Tier 3: found ${tier3Items.length} skills`);
  }

  // 合并结果
  const allItems = [...tier1Items, ...tier2Items, ...tier3Items];

  // 按 tier → category → name 排序
  allItems.sort((a, b) => {
    const tierOrder = { 'tier-1': 0, 'tier-2': 1, 'tier-3': 2 };
    const tierCmp = (tierOrder[a.tierId] ?? 99) - (tierOrder[b.tierId] ?? 99);
    if (tierCmp !== 0) return tierCmp;

    const catCmp = (a.category || '').localeCompare(b.category || '');
    if (catCmp !== 0) return catCmp;

    return a.name.localeCompare(b.name);
  });

  return {
    items: allItems,
    stats: {
      tier1Count: tier1Items.length,
      tier2Count: tier2Items.length,
      tier3Count: tier3Items.length,
      total: allItems.length,
      pathHashes: {
        tier1: Array.from(tier1PathHashes),
        tier2: Array.from(tier2PathHashes),
      },
      cacheSize: pathHashCache.size,
      scannedAt: new Date().toISOString(),
    },
  };
}

export { pathHashCache };
