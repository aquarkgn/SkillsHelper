import { BookOpen, LayoutDashboard, Layers, Settings, TerminalSquare } from 'lucide-react'
import type { ModuleKey } from '@/components/layout/Topbar'
import { cn } from '@/lib/cn'
import { getEditorMeta, isNoneEditor, normalizeEditorKey, PINNED_SKILL_SOURCES } from '@/lib/editors'
import { COMMAND_BRAND_SUMMARIES } from '@/lib/commands'
import { CommandIcon } from '@/components/views/CommandIcon'
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon'
import type { Stats } from '@/types'

interface SidebarProps {
  module: ModuleKey
  view: 'home' | 'skills' | 'settings' | 'cli' | 'editor'
  editorFilter: string | null
  selectedCommandBrand: string | null
  stats: Stats | null
  /** 品牌回首页（仪表盘）。 */
  onHome: () => void
  onSettings: () => void
  /** 选中命令品牌；传 null 表示「全部命令」。 */
  onCommandBrand: (brand: string | null) => void
  /** key=null 表示「全部技能」。 */
  onEditor: (key: string | null) => void
}

export function Sidebar({
  module,
  view,
  editorFilter,
  selectedCommandBrand,
  stats,
  onHome,
  onSettings,
  onCommandBrand,
  onEditor,
}: SidebarProps) {
  const byEditor = Object.entries(stats?.byEditor ?? {}).reduce<Record<string, number>>(
    (normalized, [key, count]) => {
      const editorKey = normalizeEditorKey(key)
      normalized[editorKey] = (normalized[editorKey] ?? 0) + count
      return normalized
    },
    {},
  )
  const pinnedSourceSet = new Set<string>(PINNED_SKILL_SOURCES)
  const editors = Object.entries(byEditor)
    .filter(([k, count]) => !isNoneEditor(k) && !pinnedSourceSet.has(k) && count > 0)
    .sort((a, b) => b[1] - a[1])
  const pinnedEditors = PINNED_SKILL_SOURCES.map((key) => [key, byEditor[key] ?? 0] as const)
  const noneCount = Object.entries(byEditor).find(([k]) => isNoneEditor(k))?.[1] ?? 0
  const total = stats?.total ?? 0
  const commandBrands = COMMAND_BRAND_SUMMARIES

  const rowCls = (active: boolean, muted = false) =>
    cn(
      'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-body-sm transition-colors',
      active
        ? 'bg-primary-soft text-primary'
        : muted
          ? 'text-muted-foreground/70 hover:bg-muted hover:text-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )

  const sectionCls = 'mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70'

  return (
    <aside className="sidebar">
      <p className={sectionCls}>工作区</p>
      <button onClick={onHome} className={rowCls(module === 'home' && view === 'home')}>
        <span className="flex items-center gap-2">
          <LayoutDashboard size={16} />
          首页
        </span>
      </button>

      <button
        onClick={() => onEditor(null)}
        className={rowCls(module === 'skills' && view === 'skills' && editorFilter === null)}
      >
        <span className="flex items-center gap-2">
          <BookOpen size={16} />
          技能库
        </span>
        <span className="text-caption opacity-70">{total || ''}</span>
      </button>

      <button
        onClick={() => onCommandBrand(null)}
        className={rowCls(module === 'commands' && view === 'cli' && selectedCommandBrand === null)}
      >
        <span className="flex items-center gap-2">
          <TerminalSquare size={16} />
          命令手册
        </span>
        <span className="text-caption opacity-70">{commandBrands.length}</span>
      </button>

      {module === 'skills' && view === 'skills' && (
        <>
          <p className={sectionCls}>来源</p>

          {[...editors, ...pinnedEditors].map(([key, count]) => {
            const meta = getEditorMeta(key)
            const active = editorFilter === key
            return (
              <button key={key} onClick={() => onEditor(key)} className={rowCls(active, true)}>
                <span className="flex min-w-0 items-center gap-2">
                  <OfficialBrandIcon
                    brand={meta.iconBrand}
                    size={20}
                    label={meta.label}
                    className="rounded"
                    fallbackClassName="text-muted-foreground"
                  />
                  <span className="truncate">{meta.label}</span>
                </span>
                <span className="text-caption opacity-70">{count}</span>
              </button>
            )
          })}

          {noneCount > 0 && (
            <button
              onClick={() => onEditor('(none)')}
              className={rowCls(editorFilter === '(none)', true)}
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Layers size={16} />
                未分类
              </span>
              <span className="text-caption opacity-70">{noneCount}</span>
            </button>
          )}
        </>
      )}

      {module === 'commands' && view === 'cli' && (
        <>
          <p className={sectionCls}>命令品牌</p>

          {commandBrands.map((summary) => {
            const active = selectedCommandBrand === summary.brand
            return (
              <button
                key={summary.brand}
                onClick={() => onCommandBrand(summary.brand)}
                className={rowCls(active, true)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CommandIcon brand={summary.brand} iconBrand={summary.iconBrand} size={20} />
                  <span className="truncate font-mono">{summary.brand}</span>
                </span>
                <span
                  className="text-caption opacity-70"
                  aria-label={`${summary.flagCount} 个 flag，${summary.subcommandCount} 个子命令`}
                >
                  {summary.flagCount}/{summary.subcommandCount}
                </span>
              </button>
            )
          })}
        </>
      )}

      <button onClick={onSettings} className={cn(rowCls(view === 'settings'), 'mt-auto')}>
        <span className="flex items-center gap-2">
          <Settings size={16} />
          设置
        </span>
      </button>
    </aside>
  )
}
