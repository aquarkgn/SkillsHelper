/**
 * @file descriptor.mjs
 * ScannerDescriptor 类型与 registry。
 *
 * 对标 cockpit-tools 报告第一建议：把散落在各 adapter 的检测规则
 * （目录候选、glob 模式、ignore、deep、品牌 key）显式登记成 descriptor，
 * 方便测试、热修、置信度判定。
 *
 * 阶段一渐进迁移：registry 与现有 editor-tiers.mjs 配置并存，
 * adapter 逐个改为读 descriptor。本文件只管"去哪扫、用什么 glob"，
 * 不管"怎么解析"（解析逻辑仍由各 adapter 自持，避免行为变化）。
 *
 * 置信度四级（对标报告第二建议）：
 *   L1 只发现目录 / L2 命中技能文件 / L3 解析出有效技能 / L4 完整元数据
 */

/**
 * @typedef {Object} DetectSpec
 * @property {string} globalPath        - 全局扫描根目录（支持 ~）
 * @property {string} [projectPath]     - 项目级扫描相对路径
 * @property {string[]} globPatterns    - fast-glob 模式列表
 * @property {string[]} [ignore]        - ignore 列表
 * @property {number} [deep]            - glob 递归深度
 */

/**
 * @typedef {Object} ScannerDescriptor
 * @property {string} id                - 唯一标识，如 'claude-code' / 'tier2-user' / 'tier3-other:homebrew'
 * @property {'tier-1'|'tier-2'|'tier-3'} tier
 * @property {string} brand             - 品牌 key（用于图标映射）
 * @property {string} label             - 人类可读名称
 * @property {DetectSpec} detect        - 检测规则
 * @property {string} [editorName]      - SkillItem.editor 字段值
 * @property {string} [sourceTag]       - SkillItem.source 字段值
 */

const registry = new Map();

/**
 * 校验 descriptor 必填字段。手写校验，不引入 zod（见迭代计划 8.2）。
 * @param {ScannerDescriptor} desc
 * @throws {Error} 字段缺失或类型错误时抛出
 */
export function validateDescriptor(desc) {
  if (!desc || typeof desc !== 'object') {
    throw new Error('descriptor 必须是对象');
  }
  const required = ['id', 'tier', 'brand', 'label', 'detect'];
  for (const key of required) {
    if (desc[key] === undefined || desc[key] === null) {
      throw new Error(`descriptor 缺失必填字段: ${key}`);
    }
  }
  const validTiers = ['tier-1', 'tier-2', 'tier-3'];
  if (!validTiers.includes(desc.tier)) {
    throw new Error(`descriptor.tier 非法: ${desc.tier}，应为 ${validTiers.join('|')}`);
  }
  if (!desc.detect || typeof desc.detect !== 'object') {
    throw new Error('descriptor.detect 必须是对象');
  }
  if (!desc.detect.globalPath || typeof desc.detect.globalPath !== 'string') {
    throw new Error('descriptor.detect.globalPath 必须是非空字符串');
  }
  if (!Array.isArray(desc.detect.globPatterns) || desc.detect.globPatterns.length === 0) {
    throw new Error('descriptor.detect.globPatterns 必须是非空数组');
  }
}

/**
 * 注册一个 descriptor。同 id 覆盖（支持热修）。
 * @param {ScannerDescriptor} desc
 * @returns {ScannerDescriptor}
 */
export function registerDescriptor(desc) {
  validateDescriptor(desc);
  registry.set(desc.id, desc);
  return desc;
}

/**
 * 批量注册。
 * @param {ScannerDescriptor[]} descs
 */
export function registerDescriptors(descs) {
  for (const d of descs) registerDescriptor(d);
}

/**
 * 按 id 查询 descriptor。
 * @param {string} id
 * @returns {ScannerDescriptor | null}
 */
export function getDescriptor(id) {
  return registry.get(id) || null;
}

/**
 * 列出全部 descriptor（按 tier 排序）。
 * @returns {ScannerDescriptor[]}
 */
export function listDescriptors() {
  const order = { 'tier-1': 0, 'tier-2': 1, 'tier-3': 2 };
  return [...registry.values()].sort((a, b) => (order[a.tier] ?? 99) - (order[b.tier] ?? 99));
}

/**
 * 按 tier 过滤。
 * @param {'tier-1'|'tier-2'|'tier-3'} tier
 * @returns {ScannerDescriptor[]}
 */
export function descriptorsByTier(tier) {
  return listDescriptors().filter(d => d.tier === tier);
}

/**
 * 清空 registry（仅测试用）。
 */
export function _resetForTest() {
  registry.clear();
}

/**
 * 置信度级别判定。输入扫描结果，输出该 source 的置信度。
 *
 * L1 只发现目录       - globalPath 存在但未命中技能文件
 * L2 命中技能文件     - glob 匹配到至少 1 个 SKILL.md
 * L3 解析出有效技能   - frontmatter 解析成功，name 非空
 * L4 完整元数据       - name + description 齐全
 *
 * @param {Object} result
 * @param {boolean} result.dirExists       - 检测目录是否存在
 * @param {number}  result.matchedFiles    - glob 命中文件数
 * @param {number}  result.parsedValid     - 解析成功（name 非空）的技能数
 * @param {number}  result.metadataComplete - 元数据完整（name+description）的技能数
 * @returns {'L1'|'L2'|'L3'|'L4'|null}     - dirExists 为 false 时返回 null
 */
export function computeConfidence({ dirExists, matchedFiles, parsedValid, metadataComplete }) {
  if (!dirExists) return null;
  if ((metadataComplete || 0) > 0) return 'L4';
  if ((parsedValid || 0) > 0) return 'L3';
  if ((matchedFiles || 0) > 0) return 'L2';
  return 'L1';
}
