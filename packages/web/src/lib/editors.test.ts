import { describe, it, expect } from 'vitest'
import { getEditorMeta, isNoneEditor, editorLabel, normalizeEditorKey } from '@/lib/editors'

describe('editors 映射（D2 主轴 = editor）', () => {
  it('按关键字归一着色（Claude/Codex/Hermes/Cursor）', () => {
    expect(getEditorMeta('Claude Code').color).toBe('#D97757')
    expect(getEditorMeta('codex').color).toBe('#10A37F')
    expect(getEditorMeta('Hermes Agent').color).toBe('#4A5FC7')
    expect(getEditorMeta('Cursor').color).toBe('#1F2937')
    expect(getEditorMeta('my-skills').color).toBe('#10B981')
    expect(getEditorMeta('other-skills').color).toBe('#8B5CF6')
  })

  it('label 透传原值，已知内置来源转中文，(none) → 未分类', () => {
    expect(getEditorMeta('Claude Code').label).toBe('Claude Code')
    expect(getEditorMeta('my-skills').label).toBe('自定义技能')
    expect(getEditorMeta('other-skills').label).toBe('其它技能')
    expect(getEditorMeta('(none)').label).toBe('未分类')
    expect(editorLabel('Cursor')).toBe('Cursor')
    expect(editorLabel('(none)')).toBe('未分类')
  })

  it('未知 editor 走兜底色（C6）', () => {
    const meta = getEditorMeta('SomeNewTool 9000')
    expect(meta.color).toBe('#6B7280')
    expect(meta.icon).toBeTruthy()
  })

  it('isNoneEditor 识别空/(none)', () => {
    expect(isNoneEditor('(none)')).toBe(true)
    expect(isNoneEditor('')).toBe(true)
    expect(isNoneEditor('Claude Code')).toBe(false)
  })

  it('Claude 多来源归一为同一个 Claude Code 筛选键', () => {
    for (const source of ['Claude', 'Claude Code', 'claude-agents', 'claude-plugin', 'Anthropic']) {
      expect(normalizeEditorKey(source)).toBe('claude-code')
    }
  })
})
