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
  tierFilter: 'official' | 'other' | null
  onTier: (tier: 'official' | 'other' | null) => void
  kindFilter: string | null
  onKind: (kind: string | null) => void
  query: string
}>

function renderSkills(items: SkillItem[], options: RenderSkillsOptions = {}) {
  return render(
    <SkillsView
      items={items}
      editorFilter={options.editorFilter ?? null}
      onEditorFilter={options.onEditorFilter}
      tierFilter={options.tierFilter ?? null}
      onTier={options.onTier}
      query={options.query ?? ''}
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

  it('插件条目使用服务端暴露的插件 logo 地址', () => {
    const { container } = renderSkills([
      mkSkill({
        id: 'sites',
        kind: 'plugin',
        name: 'sites',
        title: 'Sites',
        editorBrand: 'codex',
        iconUrl: '/api/plugin-icons/sites',
        plugin: {
          manifestPath: '/tmp/sites/.codex-plugin/plugin.json',
          capabilities: [],
          logoPath: '/tmp/sites/assets/logo.svg',
        },
      }),
    ])

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img).toHaveAttribute('src', '/api/plugin-icons/sites')
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

  it('所属编辑器品牌优先于内容品牌作为列表图标，并同时展示双品牌徽章', () => {
    const { container } = renderSkills([
      mkSkill({
        id: 'hermes-airtable',
        editor: 'Hermes',
        editorBrand: 'hermes',
        brand: 'Airtable',
      }),
    ])

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/icons/hermes?size=24')
    expect(screen.getByText('所属 Hermes')).toBeInTheDocument()
    expect(screen.getByText('内容 Airtable')).toBeInTheDocument()
  })

  it('无所属品牌时显示默认技能图标与未标记徽章', () => {
    renderSkills([
      mkSkill({
        id: 'unbranded-skill',
        tier: 'tier-2',
        source: 'my-skills',
        editor: 'my-skills',
      }),
    ])

    const fallback = screen.getAllByTestId('official-brand-icon-fallback')
    expect(fallback).not.toHaveLength(0)
    expect(fallback[0]?.querySelector('img')).toHaveAttribute('src', '/brand-icon.png')
    expect(screen.getByText('未标记')).toBeInTheDocument()
  })

  it('列表明确显示后台翻译排队和失败状态', () => {
    renderSkills([
      mkSkill({ id: 'translation-pending', translation: { name: 'pending', description: 'pending' } }),
      mkSkill({ id: 'translation-failed', name: 'translation-failed', translation: { name: 'failed', description: 'failed' } }),
    ])

    expect(screen.getByText('翻译准备中')).toBeInTheDocument()
    expect(screen.getByText('翻译不可用')).toBeInTheDocument()
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

  it('详情上下文卡片不显示技能层级标签', () => {
    renderSkills([
      mkSkill({ id: 'custom-skill', tier: 'tier-2', source: 'my-skills', editor: 'my-skills' }),
    ])

    const contextPanel = screen.getByText('当前条目').closest('section')
    expect(contextPanel).not.toHaveTextContent('自定义技能')
    expect(contextPanel).not.toHaveTextContent('其它技能')
  })

  it('范围筛选把其它技能作为技能库的一部分展示', () => {
    renderSkills(
      [
        mkSkill({ id: 'tool-skill', name: 'tool-skill', tier: 'tier-1' }),
        mkSkill({ id: 'custom-skill', name: 'custom-skill', tier: 'tier-2', source: 'my-skills', editor: 'my-skills' }),
        mkSkill({
          id: 'other-skill',
          name: 'other-skill',
          tier: 'tier-3',
          source: 'other-skills',
          editor: 'other-skills',
        }),
      ],
      { tierFilter: 'other' },
    )

    expect(screen.getAllByText('other-skill').length).toBeGreaterThan(0)
    expect(screen.getAllByText('custom-skill').length).toBeGreaterThan(0)
    expect(screen.queryByText('tool-skill')).toBeNull()
    expect(screen.getByRole('button', { name: /其它技能\s*2/ })).toBeInTheDocument()
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

    fireEvent.change(screen.getByLabelText('来源'), { target: { value: 'anthropic-claude' } })
    fireEvent.change(screen.getByLabelText('类型'), { target: { value: 'mcp' } })

    expect(onEditorFilter).toHaveBeenCalledWith('anthropic-claude')
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

    expect(options).toEqual([
      '全部来源',
      'ChatGPT / Codex 0',
      'Anthropic / Claude Code 1',
      'Hermes 0',
      'OpenClaw 0',
      '自定义技能 1',
    ])
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

    expect(screen.getByText('所属 自定义技能')).toBeInTheDocument()
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
        tierFilter="other"
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

  it('插件显示中文能力标签，并支持中文功能词搜索', () => {
    renderSkills(
      [
        mkSkill({
          id: 'sites',
          kind: 'plugin',
          name: 'sites',
          title: 'Sites',
          description: 'Build and deploy websites with Sites',
          editor: 'Codex',
          editorBrand: 'codex',
          tags: ['build', 'deploy', 'sites', 'website'],
          plugin: {
            manifestPath: '/tmp/sites/.codex-plugin/plugin.json',
            capabilities: [
              { kind: 'skill', label: 'skills', count: 1 },
              { kind: 'mcp', label: 'mcpServers' },
              { kind: 'app', label: 'apps' },
              { kind: 'interactive', label: 'Interactive' },
              { kind: 'write', label: 'Write' },
            ],
          },
        }),
      ],
      { query: '建站' },
    )

    expect(screen.getAllByText('技能').length).toBeGreaterThan(0)
    expect(screen.getByText('MCP 服务')).toBeInTheDocument()
    expect(screen.getByText('可交互')).toBeInTheDocument()
    expect(screen.getByText('可写入')).toBeInTheDocument()
    expect(screen.getAllByText('Sites').length).toBeGreaterThan(0)
    expect(screen.getByText('使用 Sites 构建和部署网站')).toBeInTheDocument()
  })

  it('搜索插件全名时精确命中排在第一位', () => {
    const { container } = renderSkills(
      [
        mkSkill({
          id: 'presentations',
          kind: 'plugin',
          name: 'presentations',
          title: 'Presentations',
          description: 'Create Sites pitch decks',
          editorBrand: 'codex',
          tags: ['sites'],
          plugin: {
            manifestPath: '/tmp/presentations/.codex-plugin/plugin.json',
            capabilities: [],
          },
        }),
        mkSkill({
          id: 'sites',
          kind: 'plugin',
          name: 'sites',
          title: 'Sites',
          description: 'Build and deploy websites with Sites',
          editorBrand: 'codex',
          tags: ['sites'],
          plugin: {
            manifestPath: '/tmp/sites/.codex-plugin/plugin.json',
            capabilities: [],
          },
        }),
        mkSkill({
          id: 'spreadsheets',
          kind: 'plugin',
          name: 'spreadsheets',
          title: 'Spreadsheets',
          description: 'Track Sites launch data',
          editorBrand: 'codex',
          tags: ['sites'],
          plugin: {
            manifestPath: '/tmp/spreadsheets/.codex-plugin/plugin.json',
            capabilities: [],
          },
        }),
      ],
      { query: 'sites' },
    )

    const listItems = Array.from(container.querySelectorAll('[data-testid="skill-list-item"]'))
    expect(listItems[0]).toHaveAttribute('data-skill-id', 'sites')
  })

  it('点击范围按钮回传 other，用于首页其它技能快捷入口', () => {
    const onTier = vi.fn()

    renderSkills(
      [
        mkSkill({ id: 'tool-skill', name: 'tool-skill', tier: 'tier-1' }),
        mkSkill({ id: 'other-skill', name: 'other-skill', tier: 'tier-3' }),
      ],
      { onTier },
    )

    fireEvent.click(screen.getByRole('button', { name: /其它技能\s*1/ }))
    expect(onTier).toHaveBeenCalledWith('other')
  })
})
