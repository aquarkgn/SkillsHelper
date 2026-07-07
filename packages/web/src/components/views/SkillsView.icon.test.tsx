import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SkillsView } from './SkillsView'
import type { SkillItem } from '@/types'

vi.mock('./SkillDetail', () => ({
  SkillDetail: () => <div data-testid="skill-detail" />,
}))

function mkSkill(partial: Partial<SkillItem>): SkillItem {
  return {
    id: partial.id || 'skill-id',
    kind: 'skill',
    source: 'tier1-editor',
    name: 'demo-skill',
    tier: 'tier-1',
    paths: { abs: '/tmp/demo/SKILL.md', rootKind: 'home' },
    preview: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

type RenderSkillsOptions = Partial<{
  editorFilter: string | null
  onEditorFilter: (key: string | null) => void
  tierFilter: 'tier-1' | 'tier-2' | 'tier-3' | null
  onTier: (tier: 'tier-1' | 'tier-2' | 'tier-3' | null) => void
  kindFilter: string | null
  onKind: (kind: string | null) => void
}>

function renderSkills(items: SkillItem[], options: RenderSkillsOptions = {}) {
  return render(
    <SkillsView
      items={items}
      editorFilter={options.editorFilter ?? null}
      onEditorFilter={options.onEditorFilter}
      tierFilter={options.tierFilter ?? null}
      onTier={options.onTier}
      query=""
      onQuery={vi.fn()}
      kindFilter={options.kindFilter ?? null}
      onKind={options.onKind ?? vi.fn()}
      selectedId={null}
      onSelect={vi.fn()}
    />,
  )
}

describe('SkillsView 官方图标', () => {
  it('优先渲染后端列表接口返回的 iconUrl', () => {
    const { container } = renderSkills([
      mkSkill({
        id: 'cursor-with-icon-url',
        editorBrand: 'cursor',
        iconUrl: '/api/icons/cursor?size=64',
      }),
    ])

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img).toHaveAttribute('src', '/api/icons/cursor?size=64')
  })

  it('没有 iconUrl 时使用 editorBrand 请求官方图标', () => {
    const { container } = renderSkills([
      mkSkill({
        id: 'cursor-editor-brand-only',
        editorBrand: 'cursor',
      }),
    ])

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img).toHaveAttribute('src', '/api/icons/cursor?size=24')
  })

  it('右侧上下文面板兼容后端返回的字符串分类', () => {
    renderSkills([
      mkSkill({
        id: 'string-category',
        category: 'tooling',
        tags: ['release'],
      }),
    ])

    expect(screen.getByText('tooling')).toBeInTheDocument()
    expect(screen.getByText('release')).toBeInTheDocument()
  })

  it('范围筛选把其它技能作为技能库的一部分展示', () => {
    renderSkills(
      [
        mkSkill({ id: 'tool-skill', name: 'tool-skill', tier: 'tier-1' }),
        mkSkill({
          id: 'other-skill',
          name: 'other-skill',
          tier: 'tier-3',
          source: 'other-skills',
          editor: 'other-skills',
        }),
      ],
      { tierFilter: 'tier-3' },
    )

    expect(screen.getAllByText('other-skill').length).toBeGreaterThan(0)
    expect(screen.queryByText('tool-skill')).toBeNull()
    expect(screen.getByRole('button', { name: /其它技能\s*1/ })).toBeInTheDocument()
  })

  it('搜索区来源和类型筛选会回传受控值', () => {
    const onEditorFilter = vi.fn()
    const onKind = vi.fn()

    renderSkills(
      [
        mkSkill({ id: 'claude-skill', name: 'claude-skill', editor: 'Claude Code', kind: 'skill' }),
        mkSkill({ id: 'mcp-tool', name: 'mcp-tool', editor: 'Codex', kind: 'mcp' }),
      ],
      { onEditorFilter, onKind },
    )

    fireEvent.change(screen.getByLabelText('来源'), { target: { value: 'Claude Code' } })
    fireEvent.change(screen.getByLabelText('类型'), { target: { value: 'mcp' } })

    expect(onEditorFilter).toHaveBeenCalledWith('Claude Code')
    expect(onKind).toHaveBeenCalledWith('mcp')
  })

  it('来源下拉固定保留自定义技能和其它技能入口', () => {
    renderSkills([
      mkSkill({ id: 'claude-skill', name: 'claude-skill', editor: 'Claude Code' }),
      mkSkill({
        id: 'custom-skill',
        name: 'custom-skill',
        tier: 'tier-2',
        source: 'my-skills',
        editor: 'my-skills',
      }),
    ])

    const sourceSelect = screen.getByLabelText('来源')
    const options = Array.from(sourceSelect.querySelectorAll('option')).map((option) =>
      option.textContent,
    )

    expect(options).toEqual(['全部来源', 'Claude Code 1', '自定义技能 1', '其它技能 0'])
  })

  it('自定义技能条目不重复显示 my-skills 来源短码', () => {
    renderSkills([
      mkSkill({
        id: 'custom-skill',
        name: 'custom-skill',
        tier: 'tier-2',
        source: 'my-skills',
        editor: 'my-skills',
      }),
    ])

    expect(screen.getAllByText('自定义技能').length).toBeGreaterThan(0)
    expect(screen.queryByText('我的技能')).toBeNull()
    expect(screen.queryByText('my-skills')).toBeNull()
  })

  it('清除筛选会重置搜索、来源、范围和类型', () => {
    const onQuery = vi.fn()
    const onEditorFilter = vi.fn()
    const onTier = vi.fn()
    const onKind = vi.fn()

    render(
      <SkillsView
        items={[
          mkSkill({
            id: 'custom-skill',
            name: 'custom-skill',
            tier: 'tier-2',
            source: 'my-skills',
            editor: 'my-skills',
          }),
        ]}
        editorFilter="my-skills"
        onEditorFilter={onEditorFilter}
        tierFilter="tier-2"
        onTier={onTier}
        query="custom"
        onQuery={onQuery}
        kindFilter="skill"
        onKind={onKind}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }))

    expect(onQuery).toHaveBeenCalledWith('')
    expect(onEditorFilter).toHaveBeenCalledWith(null)
    expect(onTier).toHaveBeenCalledWith(null)
    expect(onKind).toHaveBeenCalledWith(null)
  })

  it('点击范围按钮回传 tier-3，用于首页其它技能快捷入口', () => {
    const onTier = vi.fn()

    renderSkills(
      [
        mkSkill({ id: 'tool-skill', name: 'tool-skill', tier: 'tier-1' }),
        mkSkill({ id: 'other-skill', name: 'other-skill', tier: 'tier-3' }),
      ],
      { onTier },
    )

    fireEvent.click(screen.getByRole('button', { name: /其它技能\s*1/ }))
    expect(onTier).toHaveBeenCalledWith('tier-3')
  })
})
