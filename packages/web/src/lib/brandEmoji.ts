/**
 * CLI 命令品牌的 emoji 兜底映射。
 *
 * 与 packages/scanner/src/icon/brand-map.mjs 的 BRAND_APP_MAP.emoji 字段
 * 保持口径一致；该字段由后端扫描器维护（同步成本低、品牌集固定 5 个）。
 * 这里仅放 Command 模块当前用到的 brand，避免引入整个 brand-map 的依赖。
 *
 * CommandIcon 的优先级：静态 SVG → emoji（本表）→ TerminalSquare。
 * Command 模块的 brand 集合来自 packages/web/src/data/commands.json。
 */

export const BRAND_EMOJI_FALLBACK: Readonly<Record<string, string>> = Object.freeze({
  claude: '🤖',
  code: '📝',
  codex: '📋',
  gstach: '⚡',
  hermes: '⚡',
})

/** 取 brand 的 emoji 兜底；未登记时返回 undefined。 */
export function emojiForBrand(brand: string): string | undefined {
  return BRAND_EMOJI_FALLBACK[brand]
}