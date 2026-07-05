import { LayoutDashboard, Settings, Layers, Sparkles, TerminalSquare, Code2 } from 'lucide-react'
import type { ModuleKey } from '@/components/layout/Topbar'
import { cn } from '@/lib/cn'
import { getEditorMeta, isNoneEditor } from '@/lib/editors'
import { COMMAND_BRAND_SUMMARIES } from '@/lib/commands'
import { CommandIcon } from '@/components/views/CommandIcon'
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon'
import type { Stats } from '@/types'

interface SidebarProps {
  module: ModuleKey
  view: 'home' | 'skills' | 'otherSkills' | 'settings' | 'cli' | 'editor'
  editorFilter: string | null
  selectedCommandBrand: string | null
  stats: Stats | null
  /** 品牌回首页（仪表盘）。 */
  onHome: () => void
  onSettings: () => void
  onOtherSkills: () => void
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
  onOtherSkills,
  onCommandBrand,
  onEditor,
}: SidebarProps) {
  const byEditor = stats?.byEditor ?? {}

  // 真实 editor 项（过滤 (none)），按数量降序
  const editors = Object.entries(byEditor)
    .filter(([k]) => !isNoneEditor(k))
    .sort((a, b) => b[1] - a[1])
  const noneCount = Object.entries(byEditor).find(([k]) => isNoneEditor(k))?.[1] ?? 0
  const total = stats?.total ?? 0

  // 命令模块使用 lib/commands 预算的常量，避免每次渲染重复聚合
  const commandBrands = COMMAND_BRAND_SUMMARIES

  const rowCls = (active: boolean) =>
    cn(
      'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-body-sm transition-colors',
      active
        ? 'bg-primary-soft text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )

  const sectionCls = 'mt-3 px-3 text-caption text-muted-foreground/70'

  /**
   * 按模块差异化渲染侧栏（模块内菜单）：
   * - home：首页入口（无模块内分组）
   * - skills：技能来源 + 其它技能
   * - commands：全部命令 + 扫描到的每个命令品牌
   * - editor：编辑器占位菜单
   * 设置作为全局入口常驻底部。
   */
  return (
    <aside className="sidebar">
      <button onClick={onHome} className={rowCls(module === 'home')}>
        <span className="flex items-center gap-2">
          <LayoutDashboard size={16} />
          首页
        </span>
      </button>

      {module === 'skills' && (
        <>
          <p className={sectionCls}>技能来源</p>

          <button
            onClick={() => onEditor(null)}
            className={rowCls(view === 'skills' && editorFilter === null)}
          >
            <span className="flex items-center gap-2">
              <Layers size={16} />
              全部来源
            </span>
            <span className="text-caption opacity-80">{total}</span>
          </button>

          {editors.map(([key, count]) => {
            const meta = getEditorMeta(key)
            const active = view === 'skills' && editorFilter === key
            return (
              <button key={key} onClick={() => onEditor(key)} className={rowCls(active)}>
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
                <span className="text-caption opacity-80">{count}</span>
              </button>
            )
          })}

          {noneCount > 0 && (
            <button
              onClick={() => onEditor('(none)')}
              className={rowCls(view === 'skills' && editorFilter === '(none)')}
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Layers size={16} />
                未分类
              </span>
              <span className="text-caption opacity-80">{noneCount}</span>
            </button>
          )}

          <button onClick={onOtherSkills} className={rowCls(view === 'otherSkills')}>
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              其它技能
            </span>
          </button>
        </>
      )}

      {module === 'commands' && (
        <>
          <p className={sectionCls}>命令</p>

          <button
            onClick={() => onCommandBrand(null)}
            className={rowCls(selectedCommandBrand === null)}
          >
            <span className="flex items-center gap-2">
              <TerminalSquare size={16} />
              全部命令
            </span>
            <span className="text-caption opacity-80">{commandBrands.length}</span>
          </button>

          {commandBrands.map((summary) => {
            const active = selectedCommandBrand === summary.brand
            return (
              <button
                key={summary.brand}
                onClick={() => onCommandBrand(summary.brand)}
                className={rowCls(active)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CommandIcon brand={summary.brand} iconBrand={summary.iconBrand} size={20} />
                  <span className="truncate font-mono">{summary.brand}</span>
                </span>
                <span
                  className="text-caption opacity-80"
                  aria-label={`${summary.flagCount} 个 flag，${summary.subcommandCount} 个子命令`}
                >
                  {summary.flagCount}/{summary.subcommandCount}
                </span>
              </button>
            )
          })}
        </>
      )}

      {module === 'editor' && (
        <>
          <p className={sectionCls}>编辑器</p>
          {/* 占位项：尚未实现，非交互元素；避免用 disabled button（视觉与 disabled 矛盾） */}
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-muted-foreground/60"
            aria-disabled
          >
            <Code2 size={16} />
            编辑器（待开发）
          </div>
        </>
      )}

      {/* 全局设置常驻底部 */}
      <button onClick={onSettings} className={cn(rowCls(view === 'settings'), 'mt-auto')}>
        <span className="flex items-center gap-2">
          <Settings size={16} />
          设置
        </span>
      </button>
    </aside>
  )
}
