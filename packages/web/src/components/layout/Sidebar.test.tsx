import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import type { Stats } from '@/types'

function statsWith(byEditor: Record<string, number>): Stats {
  const total = Object.values(byEditor).reduce((a, b) => a + b, 0)
  return {
    total,
    bySource: {},
    byEditor,
    byKind: {},
    byCategory: {},
    byBrand: {},
  }
}

const noop = () => {}

describe('Sidebar 工作区导航', () => {
  it('始终渲染工作区入口和设置入口', () => {
    render(
      <Sidebar
        module="home"
        view="home"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('技能库')).toBeInTheDocument()
    expect(screen.getByText('命令手册')).toBeInTheDocument()
    expect(screen.queryByText('其它技能')).toBeNull()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('技能库模块显示来源筛选，不显示命令品牌列表', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3, Cursor: 1, '(none)': 2 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    expect(screen.getByText('来源')).toBeInTheDocument()
    expect(screen.getByText('Claude Code')).toBeInTheDocument()
    expect(screen.getByText('Cursor')).toBeInTheDocument()
    expect(screen.getByText('未分类')).toBeInTheDocument()
    expect(screen.queryByText('命令品牌')).toBeNull()
    expect(screen.queryByText('claude')).toBeNull()
  })

  it('技能库来源项使用统一中文名称展示自定义技能和其它技能，并固定在普通来源之后', () => {
    const { container } = render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ Hermes: 175, Claude: 60, 'my-skills': 22, Codex: 5 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    expect(screen.getByText('自定义技能')).toBeInTheDocument()
    expect(screen.getByText('其它技能')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('我的技能')).toBeNull()
    expect(screen.queryByText('my-skills')).toBeNull()
    expect(screen.queryByText('other-skills')).toBeNull()

    const sourceLabels = Array.from(container.querySelectorAll('button'))
      .map((button) => button.textContent ?? '')
      .filter((text) => /Hermes|Claude|Codex|自定义技能|其它技能/.test(text))
      .map((text) => text.replace(/\d+$/, ''))

    expect(sourceLabels).toEqual(['Hermes', 'Claude', 'Codex', '自定义技能', '其它技能'])
  })

  it('byEditor 全为 (none) 时只显示「未分类」来源项', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ '(none)': 5 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    expect(screen.queryByText('(none)')).toBeNull()
    expect(screen.getByText('未分类')).toBeInTheDocument()
  })

  it('点击来源项回传 editor key，点击技能库入口回传 null', () => {
    const onEditor = vi.fn()
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={onEditor}
      />,
    )

    fireEvent.click(screen.getByText('Claude Code'))
    fireEvent.click(screen.getByText('技能库'))
    expect(onEditor).toHaveBeenCalledWith('Claude Code')
    expect(onEditor).toHaveBeenCalledWith(null)
  })

  it('命令模块显示命令品牌列表，不显示技能来源筛选', () => {
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    expect(screen.getByText('命令品牌')).toBeInTheDocument()
    for (const brand of ['claude', 'code', 'codex', 'gstack', 'hermes']) {
      expect(screen.getByText(brand)).toBeInTheDocument()
    }
    expect(screen.queryByText('来源')).toBeNull()
    expect(screen.queryByText('Claude Code')).toBeNull()
  })

  it('命令模块：每个品牌旁通过 /api/icons 渲染官方图标，code 使用 vscode iconBrand', () => {
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({})}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    const expected: Record<string, string> = {
      claude: '/api/icons/claude?size=20',
      code: '/api/icons/vscode?size=20',
      codex: '/api/icons/codex?size=20',
      gstack: '/api/icons/gstack?size=20',
      hermes: '/api/icons/hermes?size=20',
    }
    for (const [brand, src] of Object.entries(expected)) {
      const item = screen.getByText(brand).closest('button')
      expect(item, `未找到 ${brand} 按钮`).toBeInTheDocument()
      const img = item?.querySelector('img')
      expect(img, `${brand} 应渲染 <img>`).toBeTruthy()
      expect(img?.getAttribute('src')).toBe(src)
      expect(img?.getAttribute('src')).not.toContain('brand-logos')
    }
  })

  it('技能模块：editor 来源项使用 /api/icons 官方图标组件', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3, Cursor: 1 })}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    const claude = screen.getByText('Claude Code').closest('button')
    const cursor = screen.getByText('Cursor').closest('button')
    expect(claude?.querySelector('img')?.getAttribute('src')).toBe('/api/icons/claude?size=20')
    expect(cursor?.querySelector('img')?.getAttribute('src')).toBe('/api/icons/cursor?size=20')
  })

  it('命令手册入口传 null，点击 claude 触发 onCommandBrand(claude)', () => {
    const onCommandBrand = vi.fn()
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({})}
        onHome={noop}
        onSettings={noop}
        onCommandBrand={onCommandBrand}
        onEditor={noop}
      />,
    )

    fireEvent.click(screen.getByText('claude'))
    fireEvent.click(screen.getByText('命令手册'))
    expect(onCommandBrand).toHaveBeenCalledWith('claude')
    expect(onCommandBrand).toHaveBeenCalledWith(null)
  })

  it('工作区入口触发对应回调', () => {
    const onHome = vi.fn()
    const onSettings = vi.fn()
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({})}
        onHome={onHome}
        onSettings={onSettings}
        onCommandBrand={noop}
        onEditor={noop}
      />,
    )

    fireEvent.click(screen.getByText('首页'))
    fireEvent.click(screen.getByText('设置'))
    expect(onHome).toHaveBeenCalledTimes(1)
    expect(onSettings).toHaveBeenCalledTimes(1)
  })
})
