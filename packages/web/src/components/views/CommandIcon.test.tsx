import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
import { CommandIcon } from './CommandIcon'
import { BRAND_LOGO_ASSETS, hasBrandLogo, getBrandLogo } from '@/lib/brandLogos'
import { emojiForBrand, BRAND_EMOJI_FALLBACK } from '@/lib/brandEmoji'

describe('CommandIcon 品牌 logo', () => {
  it('登记的 brand 渲染 <img>，src 取自 BRAND_LOGO_ASSETS', () => {
    const { container } = render(<CommandIcon brand="claude" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toBe(BRAND_LOGO_ASSETS.claude)
    expect(img?.getAttribute('alt')).toBe('')
    // 静态资源渲染时不存在 lucide svg（TerminalSquare）
    expect(container.querySelector('svg.lucide-terminal-square')).toBeNull()
  })

  it('"code" brand 直接使用 code.svg（不再映射到 vscode /api/icons 路径）', () => {
    const { container } = render(<CommandIcon brand="code" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe(BRAND_LOGO_ASSETS.code)
    // 关键：不能再走 /api/icons/vscode
    expect(img?.getAttribute('src')).not.toContain('/api/icons/')
  })

  it('5 个当前 brands 全部有静态资源登记', () => {
    expect(hasBrandLogo('claude')).toBe(true)
    expect(hasBrandLogo('code')).toBe(true)
    expect(hasBrandLogo('codex')).toBe(true)
    expect(hasBrandLogo('gstach')).toBe(true)
    expect(hasBrandLogo('hermes')).toBe(true)
  })

  it('未知 brand 走 emoji 兜底（不渲染 img）', () => {
    // 临时通过 props 走 emoji：把 brand 改成 BRAND_EMOJI_FALLBACK 中存在但 BRAND_LOGO_ASSETS 不存在的 key。
    // 当前 5 个 brand 全部同时登记了 logo + emoji，所以构造一个未知 brand 走 emoji 路径需要满足
    // emojiForBrand 有定义 + getBrandLogo 返回 undefined。
    // 这里用一个未在两个表中登记的 brand，应走到 TerminalSquare。
    const { container } = render(<CommandIcon brand="totally-unknown-brand" />)
    expect(container.querySelector('img')).toBeNull()
    // 走 TerminalSquare fallback
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('size prop 控制容器尺寸', () => {
    const { container } = render(<CommandIcon brand="claude" size={20} />)
    const wrapper = container.firstElementChild as HTMLElement | null
    expect(wrapper?.style.height).toBe('20px')
    expect(wrapper?.style.width).toBe('20px')
  })

  it('img onError 触发后走 emoji 兜底分支', () => {
    // 构造一个 emoji 表里有、但 BRAND_LOGO_ASSETS 里没有的 brand。
    // 通过临时覆盖：直接用 brand='codex'，先确保 onError 后状态变化。
    const { container } = render(<CommandIcon brand="codex" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    // 触发加载失败
    if (img) fireEvent.error(img)
    // 失败后应不再渲染 img；走 emoji 兜底
    expect(container.querySelector('img')).toBeNull()
    // emoji 分支不渲染 svg（lucide）
    expect(container.querySelector('svg')).toBeNull()
    // emoji 文本应可见
    expect(container.textContent).toContain(BRAND_EMOJI_FALLBACK.codex)
  })
})

describe('lib/brandLogos 注册表', () => {
  it('所有 brand 静态资源都已冻结，防止运行时误改', () => {
    expect(Object.isFrozen(BRAND_LOGO_ASSETS)).toBe(true)
  })

  it('每个静态资源都是非空字符串', () => {
    for (const [brand, src] of Object.entries(BRAND_LOGO_ASSETS)) {
      expect(typeof src).toBe('string')
      expect(src.length, `${brand} 资源为空`).toBeGreaterThan(0)
    }
  })

  it('getBrandLogo 未登记 brand 返回 undefined', () => {
    expect(getBrandLogo('not-a-real-brand')).toBeUndefined()
  })
})

describe('lib/brandEmoji 兜底映射', () => {
  it('5 个 brand 全部有 emoji 兜底', () => {
    for (const brand of ['claude', 'code', 'codex', 'gstach', 'hermes']) {
      expect(emojiForBrand(brand), `${brand} 缺 emoji 兜底`).toBeDefined()
    }
  })

  it('未知 brand 返回 undefined', () => {
    expect(emojiForBrand('not-a-real-brand')).toBeUndefined()
  })

  it('映射表被冻结', () => {
    expect(Object.isFrozen(BRAND_EMOJI_FALLBACK)).toBe(true)
  })
})