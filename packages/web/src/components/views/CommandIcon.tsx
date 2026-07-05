import { useState } from 'react'
import { TerminalSquare } from 'lucide-react'
import { getBrandLogo } from '@/lib/brandLogos'
import { emojiForBrand } from '@/lib/brandEmoji'

interface CommandIconProps {
  brand: string
  /** 容器像素尺寸（正方形）。默认 36（CliCommandView 主内容）。 */
  size?: number
}

/**
 * 命令品牌的 logo 组件，三级 fallback：
 *   1. 静态品牌 SVG（packages/web/src/assets/brand-logos/，构建时打入 dist）
 *   2. brand-map 中的 emoji 兜底（共享 scanner 模块的 emoji 映射）
 *   3. 通用 TerminalSquare lucide 占位
 *
 * 历史变更：原版仅尝试 /api/icons（依赖本机是否安装对应 .app），CLI 工具
 * 普遍没有 GUI .app 导致全部 fallback 到 TerminalSquare。现改为优先使用
 * 前端构建产物中的品牌 SVG，不依赖运行环境。/api/icons 仍保留供 Skill 模块
 * 使用（其 brand 集合由后端扫描器决定）。
 */
export function CommandIcon({ brand, size = 36 }: CommandIconProps) {
  const [failed, setFailed] = useState(false)
  const staticSrc = getBrandLogo(brand)
  // 按比例缩放 img 与 fallback 图标
  const inner = Math.round(size * 0.78) // 28/36 ≈ 0.78

  // 第 1 级：静态资源命中且未加载失败
  if (staticSrc && !failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-md bg-muted"
        style={{ height: size, width: size }}
      >
        <img
          src={staticSrc}
          alt=""
          width={inner}
          height={inner}
          loading="lazy"
          onError={() => setFailed(true)}
          className="rounded-[4px] object-contain"
          style={{ height: inner, width: inner }}
        />
      </span>
    )
  }

  // 第 2 级：emoji 兜底（brand-map 已登记的 codex/hermes/gstach 等）
  const emoji = emojiForBrand(brand)
  if (emoji) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-md bg-muted"
        style={{ height: size, width: size, fontSize: Math.round(size * 0.5), lineHeight: 1 }}
        aria-label={brand}
      >
        {emoji}
      </span>
    )
  }

  // 第 3 级：通用 TerminalSquare 占位
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
      style={{ height: size, width: size }}
    >
      <TerminalSquare size={Math.round(size * 0.5)} />
    </span>
  )
}
