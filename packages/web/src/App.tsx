import { useCallback, useEffect, useReducer, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar, type ModuleKey } from '@/components/layout/Topbar'
import { DashboardView } from '@/components/views/DashboardView'
import { SkillsView } from '@/components/views/SkillsView'
import { SettingsView } from '@/components/views/SettingsView'
import { CliCommandView } from '@/components/views/CliCommandView'
import { EditorPlaceholder } from '@/components/views/EditorPlaceholder'
import { useLiveReload } from '@/hooks/useLiveReload'
import { fetchSkills, fetchStats, reload } from '@/lib/api'
import type { SkillItem, Stats } from '@/types'

type TierFilter = 'official' | 'other'

export type View = 'home' | 'skills' | 'settings' | 'cli' | 'editor'

export interface UIState {
  module: ModuleKey
  /** 当前模块内的视图；home 对应 dashboard，commands 对应 cli。 */
  view: View
  editorFilter: string | null
  tierFilter: TierFilter | null
  kindFilter: string | null
  query: string
  commandQuery: string
  selectedId: string | null
  /** CLI 命令侧栏选中的品牌；null 表示「全部命令」。 */
  selectedCommandBrand: string | null
}

export type Action =
  | { type: 'module'; module: ModuleKey }
  | { type: 'home' }
  | { type: 'dashboard' }
  | { type: 'settings' }
  | { type: 'otherSkills' }
  | { type: 'cli' }
  | { type: 'editorView' }
  | { type: 'editor'; key: string | null }
  | { type: 'tier'; tier: TierFilter | null }
  | { type: 'query'; query: string }
  | { type: 'commandQuery'; query: string }
  | { type: 'kind'; kind: string | null }
  | { type: 'select'; id: string }
  | { type: 'selectCommandBrand'; brand: string | null }

export const initialState: UIState = {
  module: 'home',
  view: 'home',
  editorFilter: null,
  tierFilter: null,
  kindFilter: null,
  query: '',
  commandQuery: '',
  selectedId: null,
  selectedCommandBrand: null,
}

export function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'module':
      // 顶层 tab 切换：模块与默认视图对齐。
      // - 切回 home：清空命令品牌选中
      // - 进 commands：默认进入 cli，selectedCommandBrand 重置为 null
      // - 进 editor：进入编辑器占位视图
      // - 进 skills：从 cli 视图退出时回到 skills 视图
      if (action.module === 'home') {
        return {
          ...state,
          module: 'home',
          view: 'home',
          selectedCommandBrand: null,
        }
      }
      if (action.module === 'commands') {
        return {
          ...state,
          module: 'commands',
          view: 'cli',
          selectedCommandBrand: null,
        }
      }
      if (action.module === 'editor') {
        return {
          ...state,
          module: 'editor',
          view: 'editor',
        }
      }
      if (action.module === 'skills') {
        if (state.module === 'commands') {
          return {
            ...state,
            module: 'skills',
            view: 'skills',
            selectedCommandBrand: null,
          }
        }
        return { ...state, module: 'skills', view: 'skills' }
      }
      return state
    case 'home':
      return {
        ...state,
        module: 'home',
        view: 'home',
        selectedCommandBrand: null,
      }
    case 'dashboard':
      // 「首页 → 技能」入口：直接进入 skills 列表视图。
      // 旧实现曾使用 'dashboard' 作为 view，但首页入口与「首页视图」现在由 module='home' 表达。
      return {
        ...state,
        module: 'skills',
        view: 'skills',
        editorFilter: null,
        tierFilter: null,
        kindFilter: null,
        selectedId: null,
        selectedCommandBrand: null,
      }
    case 'settings':
      return { ...state, view: 'settings', selectedCommandBrand: null }
    case 'otherSkills':
      return {
        ...state,
        module: 'skills',
        view: 'skills',
        editorFilter: null,
        tierFilter: 'other',
        kindFilter: null,
        selectedId: null,
        selectedCommandBrand: null,
      }
    case 'cli':
      return {
        ...state,
        module: 'commands',
        view: 'cli',
        selectedCommandBrand: null,
      }
    case 'editorView':
      // editor 模块与 commands 模块无关联：清空 selectedCommandBrand 避免下次回到 commands 时看到过期 brand
      return { ...state, module: 'editor', view: 'editor', selectedCommandBrand: null }
    case 'editor':
      // 切换来源：进入技能视图，重置 kind/选中
      return {
        ...state,
        module: 'skills',
        view: 'skills',
        editorFilter: action.key,
        tierFilter: null,
        kindFilter: null,
        selectedId: null,
        selectedCommandBrand: null,
      }
    case 'tier':
      return {
        ...state,
        module: 'skills',
        view: 'skills',
        editorFilter: null,
        tierFilter: action.tier,
        kindFilter: null,
        selectedId: null,
        selectedCommandBrand: null,
      }
    case 'query':
      return { ...state, query: action.query }
    case 'commandQuery':
      return { ...state, commandQuery: action.query }
    case 'kind':
      return { ...state, kindFilter: action.kind }
    case 'select':
      return { ...state, selectedId: action.id }
    case 'selectCommandBrand':
      return { ...state, module: 'commands', view: 'cli', selectedCommandBrand: action.brand }
    default:
      return state
  }
}

export default function App() {
  const [items, setItems] = useState<SkillItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)
  const [ui, dispatch] = useReducer(reducer, initialState)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [skills, s] = await Promise.all([fetchSkills(), fetchStats()])
      setItems(skills)
      setStats(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // SSE 静默刷新：文件变更时不闪「加载中」，只更新数据
  const refresh = useCallback(async () => {
    try {
      const [skills, s] = await Promise.all([fetchSkills(), fetchStats()])
      setItems(skills)
      setStats(s)
    } catch {
      // 静默：实时刷新失败不打断当前界面
    }
  }, [])
  useLiveReload(refresh)

  async function handleReload() {
    setReloading(true)
    try {
      await reload()
      await load()
    } finally {
      setReloading(false)
    }
  }

  function renderMain() {
    if (ui.view === 'home') {
      return (
        <DashboardView
          stats={stats}
          items={items}
          onOpenSkills={() => dispatch({ type: 'dashboard' })}
          onOpenCommands={() => dispatch({ type: 'module', module: 'commands' })}
          onOpenOtherSkills={() => dispatch({ type: 'otherSkills' })}
        />
      )
    }
    if (ui.view === 'cli') {
      return (
        <CliCommandView
          selectedBrand={ui.selectedCommandBrand}
          query={ui.commandQuery}
          onQuery={(query) => dispatch({ type: 'commandQuery', query })}
          onSelectBrand={(brand) => dispatch({ type: 'selectCommandBrand', brand })}
        />
      )
    }
    if (ui.view === 'editor') {
      return <EditorPlaceholder />
    }
    if (loading) return <p className="text-body-sm text-muted-foreground">加载中…</p>
    if (error) {
      return (
        <div className="detail border-destructive">
          <p className="text-body-sm text-destructive">加载失败：{error}</p>
        </div>
      )
    }
    if (ui.view === 'settings') return <SettingsView />
    return (
      <SkillsView
        items={items}
        editorFilter={ui.editorFilter}
        onEditorFilter={(key) => dispatch({ type: 'editor', key })}
        tierFilter={ui.tierFilter}
        onTier={(tier) => dispatch({ type: 'tier', tier })}
        query={ui.query}
        onQuery={(q) => dispatch({ type: 'query', query: q })}
        kindFilter={ui.kindFilter}
        onKind={(k) => dispatch({ type: 'kind', kind: k })}
        selectedId={ui.selectedId}
        onSelect={(id) => dispatch({ type: 'select', id })}
      />
    )
  }

  return (
    <div className="app-shell">
      <Topbar
        module={ui.module}
        onModule={(m) => dispatch({ type: 'module', module: m })}
        onReload={handleReload}
        reloading={reloading}
        searchValue={ui.module === 'commands' ? ui.commandQuery : ui.query}
        onSearch={(query) => {
          if (ui.module === 'commands') {
            dispatch({ type: 'commandQuery', query })
            return
          }
          if (ui.module === 'home') {
            dispatch({ type: 'dashboard' })
          }
          dispatch({ type: 'query', query })
        }}
        scanStatus={loading ? 'loading' : reloading ? 'syncing' : error ? 'error' : 'ready'}
        skillCount={stats?.total ?? items.length}
      />
      <Sidebar
        module={ui.module}
        view={ui.view}
        editorFilter={ui.editorFilter}
        selectedCommandBrand={ui.selectedCommandBrand}
        stats={stats}
        onHome={() => dispatch({ type: 'home' })}
        onSettings={() => dispatch({ type: 'settings' })}
        onCommandBrand={(brand) => dispatch({ type: 'selectCommandBrand', brand })}
        onEditor={(key) => dispatch({ type: 'editor', key })}
      />
      <main className="main-pane">{renderMain()}</main>
    </div>
  )
}
