import { describe, it, expect } from 'vitest'
import { itemEditorKey } from './SkillsView'
import type { SkillItem } from '@/types'

function mk(partial: Partial<SkillItem>): SkillItem {
  return {
    id: 'id',
    kind: 'skill',
    source: 'hermes',
    name: 'n',
    paths: { abs: '/x', rootKind: 'home' },
    preview: '',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('itemEditorKey（与 server buildStats 口径一致）', () => {
  it('优先 editor', () => {
    expect(itemEditorKey(mk({ editor: 'Claude Code', source: 'claude-code' }))).toBe('claude-code')
  })
  it('无 editor 落到 source', () => {
    expect(itemEditorKey(mk({ editor: undefined, source: 'hermes' }))).toBe('hermes')
  })
  it('editor 与 source 皆空 → (none)', () => {
    expect(itemEditorKey(mk({ editor: undefined, source: '' }))).toBe('(none)')
  })
})
