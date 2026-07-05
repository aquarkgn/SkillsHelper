/**
 * CLI 命令品牌的本地静态 logo 资源映射。
 *
 * 设计意图：Command 模块的 brand（claude/code/codex/gstach/hermes）大多是 CLI
 * 工具而非 GUI .app，扫描本机 .app 的路线（/api/icons）拿不到图标，因此改为
 * 在前端构建产物中直接打包品牌 SVG。
 *
 * - 优先级高于 /api/icons：避免依赖本机是否安装对应 .app bundle。
 * - 缺失项 → CommandIcon 自动走 emojiForBrand() → 仍然缺失再 TerminalSquare。
 * - 资源以 import.meta.url 引入，由 Vite 在构建时哈希并打入 dist/assets/。
 */

import claudeLogo from '@/assets/brand-logos/claude.svg'
import codeLogo from '@/assets/brand-logos/code.svg'
import codexLogo from '@/assets/brand-logos/codex.svg'
import gstachLogo from '@/assets/brand-logos/gstach.svg'
import hermesLogo from '@/assets/brand-logos/hermes.svg'

export const BRAND_LOGO_ASSETS: Readonly<Record<string, string>> = Object.freeze({
  claude: claudeLogo,
  // commands.json 中 'code' 实际指 vscode CLI；与 CommandIcon 的语义保持一致
  code: codeLogo,
  codex: codexLogo,
  gstach: gstachLogo,
  hermes: hermesLogo,
})

/** 是否在静态资源表里登记了该 brand（命中即直接走静态 logo，不走 /api/icons）。 */
export function hasBrandLogo(brand: string): boolean {
  return brand in BRAND_LOGO_ASSETS
}

/** 取 brand 的静态 logo URL；未登记时返回 undefined，由调用方走 fallback。 */
export function getBrandLogo(brand: string): string | undefined {
  return BRAND_LOGO_ASSETS[brand]
}