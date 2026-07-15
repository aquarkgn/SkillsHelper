import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'

interface OfficialBrandIconProps {
  /** 品牌 key；会通过 /api/icons/:brand 读取官方图标。 */
  brand?: string | null
  /** 后端列表接口已给出的 iconUrl；优先级高于 brand 自动拼接。 */
  src?: string | null
  /** 正方形容器像素尺寸。 */
  size?: number
  /** 容器样式。 */
  className?: string
  /** 图片样式。 */
  imgClassName?: string
  /** 中性占位样式。 */
  fallbackClassName?: string
  /** 可访问性标签；默认装饰性图标。 */
  label?: string
}

function iconUrlForBrand(brand: string, size: number): string {
  return `/api/icons/${encodeURIComponent(brand)}?size=${size}`
}

/**
 * 官方品牌图标组件：只显示后端 /api/icons 返回的真实/官方图标。
 * 加载失败时使用项目品牌图标，保证未知来源也有一致、可识别的默认视觉。
 */
export function OfficialBrandIcon({
  brand,
  src,
  size = 20,
  className,
  imgClassName,
  fallbackClassName,
  label,
}: OfficialBrandIconProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const iconSrc = useMemo(() => {
    if (src) return src
    if (!brand) return null
    return iconUrlForBrand(brand, size)
  }, [brand, size, src])

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [iconSrc])

  const wrapperStyle = { height: size, width: size }
  const innerSize = Math.max(12, size - 2)

  if (iconSrc && !failed) {
    return (
      <span
        className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-muted', className)}
        style={wrapperStyle}
      >
        {!loaded && (
          <span
            className="absolute inset-0 animate-pulse bg-muted-foreground/10"
            data-testid="official-brand-icon-skeleton"
          />
        )}
        <img
          src={iconSrc}
          alt={label ?? ''}
          aria-hidden={label ? undefined : true}
          width={innerSize}
          height={innerSize}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'shrink-0 rounded-[4px] object-contain transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          style={{ height: innerSize, width: innerSize }}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-md bg-muted text-muted-foreground',
        className,
        fallbackClassName,
      )}
      style={wrapperStyle}
      aria-label={label}
      data-testid="official-brand-icon-fallback"
    >
      <img
        src="/brand-icon.png"
        alt={label ? `${label} 默认图标` : ''}
        aria-hidden={label ? undefined : true}
        width={innerSize}
        height={innerSize}
        className="rounded-[4px] object-contain"
        style={{ height: innerSize, width: innerSize }}
      />
    </span>
  )
}
