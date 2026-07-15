import { describe, it, expect } from 'vitest'
import { reducer, initialState, type UIState } from './App'

describe('App reducer 状态机（module × view，首页为默认）', () => {
  it('默认进入首页（module=home, view=home）', () => {
    expect(initialState.module).toBe('home')
    expect(initialState.view).toBe('home')
    expect(initialState.selectedCommandBrand).toBeNull()
  })

  it('editor 动作进入技能视图并重置 kind/选中（避免脏筛选）', () => {
    const dirty: UIState = {
      ...initialState,
      module: 'home',
      view: 'home',
      tierFilter: 'other',
      kindFilter: 'skill',
      selectedId: 'abc',
    }
    const next = reducer(dirty, { type: 'editor', key: 'Cursor' })
    expect(next.view).toBe('skills')
    expect(next.editorFilter).toBe('Cursor')
    expect(next.tierFilter).toBeNull()
    expect(next.kindFilter).toBeNull()
    expect(next.selectedId).toBeNull()
  })

  it('editor=null 表示全部技能', () => {
    expect(reducer(initialState, { type: 'editor', key: null }).editorFilter).toBeNull()
  })

  it('dashboard / settings 切换视图（保持模块语义）', () => {
    // settings 不改 module，但 view=settings
    expect(reducer(initialState, { type: 'settings' }).view).toBe('settings')
    // 「首页 → 技能」入口：直接进入 skills 视图，并清空 selectedCommandBrand
    const after = reducer(
      { ...initialState, selectedCommandBrand: 'claude' },
      { type: 'dashboard' },
    )
    expect(after.view).toBe('skills')
    expect(after.module).toBe('skills')
    expect(after.tierFilter).toBeNull()
    expect(after.selectedCommandBrand).toBeNull()
  })

  it('query / kind / select 只改对应字段', () => {
    expect(reducer(initialState, { type: 'query', query: 'mcp' }).query).toBe('mcp')
    expect(reducer(initialState, { type: 'commandQuery', query: 'serve' }).commandQuery).toBe('serve')
    expect(reducer(initialState, { type: 'tier', tier: 'other' }).tierFilter).toBe('other')
    expect(reducer(initialState, { type: 'kind', kind: 'skill' }).kindFilter).toBe('skill')
    expect(reducer(initialState, { type: 'select', id: 'x1' }).selectedId).toBe('x1')
  })

  it('module 切换到 commands 重置 selectedCommandBrand 为 null', () => {
    const dirty: UIState = { ...initialState, selectedCommandBrand: 'gstack' }
    const next = reducer(dirty, { type: 'module', module: 'commands' })
    expect(next.module).toBe('commands')
    expect(next.view).toBe('cli')
    expect(next.selectedCommandBrand).toBeNull()
  })

  it('cli 动作进入命令模块并清空品牌选中；切回 skills 时清空 selectedCommandBrand', () => {
    const dirty: UIState = { ...initialState, selectedCommandBrand: 'hermes' }
    const cli = reducer(dirty, { type: 'cli' })
    expect(cli.module).toBe('commands')
    expect(cli.view).toBe('cli')
    expect(cli.selectedCommandBrand).toBeNull()
    const skills = reducer(
      { ...cli, selectedCommandBrand: 'codex' },
      { type: 'module', module: 'skills' },
    )
    expect(skills.module).toBe('skills')
    expect(skills.view).toBe('skills')
    expect(skills.selectedCommandBrand).toBeNull()
  })

  it('selectCommandBrand 设置指定品牌；再 home 动作清空', () => {
    const s1 = reducer(initialState, { type: 'selectCommandBrand', brand: 'claude' })
    expect(s1.selectedCommandBrand).toBe('claude')
    const s2 = reducer(s1, { type: 'selectCommandBrand', brand: null })
    expect(s2.selectedCommandBrand).toBeNull()
    const s3 = reducer(s1, { type: 'home' })
    expect(s3.module).toBe('home')
    expect(s3.selectedCommandBrand).toBeNull()
  })

  it('editorView 进入编辑器占位，保持模块与视图一致', () => {
    const next = reducer(initialState, { type: 'editorView' })
    expect(next.module).toBe('editor')
    expect(next.view).toBe('editor')
  })

  it('editorView 从 commands 模块进入：清空 selectedCommandBrand 防止下次回到 commands 看到过期 brand', () => {
    const dirty: UIState = { ...initialState, selectedCommandBrand: 'codex' }
    const next = reducer(dirty, { type: 'editorView' })
    expect(next.module).toBe('editor')
    expect(next.view).toBe('editor')
    expect(next.selectedCommandBrand).toBeNull()
  })

  it('settings / 其它技能入口清空 selectedCommandBrand，且其它技能归入技能库筛选', () => {
    const dirty: UIState = { ...initialState, selectedCommandBrand: 'hermes' }
    const settings = reducer(dirty, { type: 'settings' })
    expect(settings.view).toBe('settings')
    expect(settings.selectedCommandBrand).toBeNull()
    const otherSkills = reducer(dirty, { type: 'otherSkills' })
    expect(otherSkills.module).toBe('skills')
    expect(otherSkills.view).toBe('skills')
    expect(otherSkills.tierFilter).toBe('other')
    expect(otherSkills.editorFilter).toBeNull()
    expect(otherSkills.selectedCommandBrand).toBeNull()
  })

  it('Topbar module 切到 home 清空 selectedCommandBrand', () => {
    const dirty: UIState = { ...initialState, selectedCommandBrand: 'claude' }
    const next = reducer(dirty, { type: 'module', module: 'home' })
    expect(next.module).toBe('home')
    expect(next.view).toBe('home')
    expect(next.selectedCommandBrand).toBeNull()
  })
})
