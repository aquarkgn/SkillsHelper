import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, fireEvent } from '@testing-library/react'
import { CommandIcon } from './CommandIcon'

describe('CommandIcon 官方品牌图标', () => {
  it('默认通过 /api/icons/:brand 读取官方图标', () => {
    const { container } = render(<CommandIcon brand="claude" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toBe('/api/icons/claude?size=36')
    expect(img?.getAttribute('src')).not.toContain('brand-logos')
  })

  it('支持 iconBrand 规范化，例如 code 使用 vscode 官方图标', () => {
    const { container } = render(<CommandIcon brand="code" iconBrand="vscode" size={20} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('/api/icons/vscode?size=20')
  })

  it('size prop 控制容器尺寸', () => {
    const { container } = render(<CommandIcon brand="claude" size={20} />)
    const wrapper = container.firstElementChild as HTMLElement | null
    expect(wrapper?.style.height).toBe('20px')
    expect(wrapper?.style.width).toBe('20px')
  })

  it('官方图标加载失败后显示中性占位，不显示自制 SVG 或 emoji', () => {
    const { container, getByTestId } = render(<CommandIcon brand="codex" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    if (img) fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(getByTestId('official-brand-icon-fallback')).toBeInTheDocument()
  })
})
