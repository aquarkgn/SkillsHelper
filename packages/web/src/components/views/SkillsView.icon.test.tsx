import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
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

function renderSkills(items: SkillItem[]) {
  return render(
    <SkillsView
      items={items}
      editorFilter={null}
      query=""
      onQuery={vi.fn()}
      kindFilter={null}
      onKind={vi.fn()}
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
})
