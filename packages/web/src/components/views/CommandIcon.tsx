import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon'

interface CommandIconProps {
  brand: string
  /** 用于官方图标解析的规范化品牌；例如 commands.json 的 code 对应 vscode。 */
  iconBrand?: string
  /** 容器像素尺寸（正方形）。默认 36（CliCommandView 主内容）。 */
  size?: number
}

/**
 * 命令品牌官方 icon：统一通过后端 /api/icons 读取。
 * 后端优先扫描本机 .app，缺失时按官方 manifest 联网下载并缓存到本地。
 * 图标缺失时显示中性占位，不再使用自制 SVG / emoji 伪装官方 icon。
 */
export function CommandIcon({ brand, iconBrand, size = 36 }: CommandIconProps) {
  return <OfficialBrandIcon brand={iconBrand ?? brand} size={size} label={brand} />
}
