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

describe('Sidebar 模块化导航', () => {
  it('默认渲染：编辑器项与「未分类」(Claude Code / Cursor)', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3, Cursor: 1, '(none)': 2 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.getByText('Claude Code')).toBeInTheDocument()
    expect(screen.getByText('Cursor')).toBeInTheDocument()
    expect(screen.getByText('未分类')).toBeInTheDocument()
    // 不要出现 CLI 命令品牌
    expect(screen.queryByText('全部命令')).toBeNull()
  })

  it('byEditor 全为 (none) 时不产出垃圾首项，只显示「未分类」', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ '(none)': 5 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.queryByText('(none)')).toBeNull()
    expect(screen.getByText('未分类')).toBeInTheDocument()
  })

  it('点击 editor 项回传其 key', () => {
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
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={onEditor}
      />
    )
    fireEvent.click(screen.getByText('Claude Code'))
    expect(onEditor).toHaveBeenCalledWith('Claude Code')
  })

  it('技能模块：出现「全部来源」「其它技能」，不出现 CLI 命令菜单', () => {
    render(
      <Sidebar
        module="skills"
        view="skills"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.getByText('全部来源')).toBeInTheDocument()
    expect(screen.getByText('其它技能')).toBeInTheDocument()
    expect(screen.queryByText('全部命令')).toBeNull()
    expect(screen.queryByText('claude')).toBeNull()
    expect(screen.queryByText('codex')).toBeNull()
  })

  it('命令模块：渲染「全部命令」与每个扫描到的品牌；不显示技能来源', () => {
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.getByText('全部命令')).toBeInTheDocument()
    for (const brand of ['claude', 'code', 'codex', 'gstack', 'hermes']) {
      expect(screen.getByText(brand)).toBeInTheDocument()
    }
    // 命令模块不混入技能侧栏菜单
    expect(screen.queryByText('全部来源')).toBeNull()
    expect(screen.queryByText('其它技能')).toBeNull()
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
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
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
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    const claude = screen.getByText('Claude Code').closest('button')
    const cursor = screen.getByText('Cursor').closest('button')
    expect(claude?.querySelector('img')?.getAttribute('src')).toBe('/api/icons/claude?size=20')
    expect(cursor?.querySelector('img')?.getAttribute('src')).toBe('/api/icons/cursor?size=20')
  })

  it('命令模块：点击 claude 触发 onCommandBrand(claude)，点击「全部命令」传 null', () => {
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
        onOtherSkills={noop}
        onCommandBrand={onCommandBrand}
        onEditor={noop}
      />
    )
    fireEvent.click(screen.getByText('claude'))
    expect(onCommandBrand).toHaveBeenCalledWith('claude')

    fireEvent.click(screen.getByText('全部命令'))
    expect(onCommandBrand).toHaveBeenCalledWith(null)
  })

  it('编辑器模块：只显示「编辑器（待开发）」与设置入口，不混入技能或命令列表', () => {
    render(
      <Sidebar
        module="editor"
        view="editor"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.getByText(/编辑器（待开发）/)).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
    expect(screen.queryByText('全部来源')).toBeNull()
    expect(screen.queryByText('全部命令')).toBeNull()
    expect(screen.queryByText('claude')).toBeNull()
  })

  it('编辑器模块：占位项不是可交互元素（div + aria-disabled，无 button）', () => {
    render(
      <Sidebar
        module="editor"
        view="editor"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({})}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    const placeholder = screen.getByText(/编辑器（待开发）/)
    // 占位项渲染为 div 而非 button
    expect(placeholder.tagName).toBe('DIV')
    // 祖先中不能有 button（防止误把占位包成 button）
    expect(placeholder.closest('button')).toBeNull()
    // 占位元素自身带 aria-disabled（表达"语义上不可交互"）
    expect(placeholder.getAttribute('aria-disabled')).toBe('true')
  })

  it('首页模块：只显示首页入口与常驻设置；不混入技能/命令侧栏', () => {
    render(
      <Sidebar
        module="home"
        view="home"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({ 'Claude Code': 3 })}
        onHome={noop}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.queryByText('全部来源')).toBeNull()
    expect(screen.queryByText('全部命令')).toBeNull()
    expect(screen.queryByText('其它技能')).toBeNull()
  })

  it('首页：点击「首页」触发 onHome', () => {
    const onHome = vi.fn()
    render(
      <Sidebar
        module="commands"
        view="cli"
        editorFilter={null}
        selectedCommandBrand={null}
        stats={statsWith({})}
        onHome={onHome}
        onSettings={noop}
        onOtherSkills={noop}
        onCommandBrand={noop}
        onEditor={noop}
      />
    )
    fireEvent.click(screen.getByText('首页'))
    expect(onHome).toHaveBeenCalledTimes(1)
  })
})
