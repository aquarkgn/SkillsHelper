import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Command,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  COMMANDS,
  getFlagCount,
  getSubcommandCount,
  getTotalFlagCount,
  getTotalSubcommandCount,
} from '@/lib/commands'
import { getSubcommandHelp, getSubcommandHelpSearchText } from '@/lib/commandHelp'
import type { CliCommand, CliCommandGroup, CliCommandSubcommand, CliSubcommandHelp } from '@/types'
import { CommandIcon } from './CommandIcon'

interface CliCommandViewProps {
  /**
   * 侧栏选中的命令品牌；`null` 表示「全部命令」。
   * UI 上 brand 始终非空字符串，但接口允许 null 以表达"未选中"。
   */
  selectedBrand: string | null
}

/** 是否在"已选中某品牌"的范围内。空字符串视作未选中（兜底） */
function isBrandSelected(brand: string | null | undefined): brand is string {
  return typeof brand === 'string' && brand.length > 0
}

function normalizeSelectedBrand(brand: string | null): string | null {
  if (!isBrandSelected(brand)) return null
  // 历史数据曾误写为 gstach；旧入口统一落到真实命令 gstack。
  return brand === 'gstach' ? 'gstack' : brand
}

function getSubcommandSearchText(command: CliCommand, subcommand: CliCommandSubcommand): string {
  const help = getSubcommandHelp(command.brand, subcommand.name)
  return [
    subcommand.name,
    subcommand.desc_zh,
    subcommand.helpStatus,
    help ? getSubcommandHelpSearchText(help) : undefined,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getSearchText(command: CliCommand): string {
  return [
    command.brand,
    command.version,
    command.summary_zh,
    ...command.groups.flatMap((group) => [
      group.name_zh,
      group.source,
      ...group.flags.flatMap((flag) => [
        flag.name,
        flag.args,
        flag.desc_zh,
        flag.raw,
      ]),
    ]),
    ...(command.subcommands ?? []).map((subcommand) => getSubcommandSearchText(command, subcommand)),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function filterCommand(command: CliCommand, query: string): CliCommand | null {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return command
  if (getSearchText(command).includes(normalized)) {
    const commandHit = [command.brand, command.version, command.summary_zh]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalized)
    const groups = command.groups
      .map((group): CliCommandGroup | null => {
        const groupHit = `${group.name_zh} ${group.source}`.toLowerCase().includes(normalized)
        const flags = groupHit || commandHit
          ? group.flags
          : group.flags.filter((flag) =>
            [flag.name, flag.args, flag.desc_zh, flag.raw]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(normalized)
          )
        return flags.length > 0 ? { ...group, flags } : null
      })
      .filter((group): group is CliCommandGroup => group !== null)
    const subcommands = commandHit
      ? command.subcommands
      : command.subcommands?.filter((subcommand) =>
        getSubcommandSearchText(command, subcommand).includes(normalized)
      )
    if (groups.length === 0 && (!subcommands || subcommands.length === 0)) return null
    return { ...command, groups, subcommands }
  }
  return null
}

function getHelpFlagCount(help: CliSubcommandHelp): number {
  return help.groups.reduce((total, group) => total + group.flags.length, 0)
}

function HelpPanel({ brand, subcommand }: { brand: string; subcommand: CliCommandSubcommand }) {
  const help = getSubcommandHelp(brand, subcommand.name)

  if (!help) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background px-4 py-4">
        <div className="font-mono text-body-sm font-semibold text-foreground">{subcommand.name}</div>
        <p className="mt-1 text-body-sm text-muted-foreground">{subcommand.desc_zh}</p>
        <p className="mt-3 text-caption text-muted-foreground">
          该子命令暂未采集详细帮助。当前可查看摘要，后续补充 --help 详情。
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-mono text-body-sm font-semibold text-foreground">
            {help.brand} {help.subcommand}
          </h3>
          <span className="rounded-sm bg-muted px-2 py-0.5 text-caption text-muted-foreground">
            {getHelpFlagCount(help)} 项
          </span>
        </div>
        <p className="mt-1 text-body-sm text-muted-foreground">{help.summary_zh}</p>
        {help.usage && (
          <pre className="mt-3 overflow-x-auto rounded-sm bg-muted px-3 py-2 font-mono text-caption text-foreground">
            {help.usage}
          </pre>
        )}
      </div>

      <div className="divide-y divide-border">
        {help.groups.map((group) => (
          <div key={`${help.brand}:${help.subcommand}:${group.name_zh}`} className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-caption font-semibold text-muted-foreground">
              <span>{group.name_zh}</span>
              <span className="rounded-sm bg-muted px-2 py-0.5">{group.flags.length}</span>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              {group.flags.map((flag) => (
                <div
                  key={`${help.brand}:${help.subcommand}:${group.name_zh}:${flag.name}:${flag.args ?? ''}`}
                  className={cn(
                    'grid gap-2 border-b border-border px-3 py-3 last:border-b-0',
                    'lg:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.4fr)]',
                  )}
                >
                  <div className="min-w-0">
                    <code className="break-words rounded-sm bg-muted px-1.5 py-0.5 font-mono text-caption text-primary">
                      {flag.name}
                    </code>
                    {flag.args && (
                      <div className="mt-1 break-words font-mono text-caption text-muted-foreground">
                        {flag.args}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm text-foreground">{flag.desc_zh}</p>
                    <p className="mt-1 break-words text-caption text-muted-foreground">{flag.raw}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {help.raw && (
        <details className="border-t border-border px-4 py-3 text-caption text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium text-foreground">查看原始 help</summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-sm bg-muted px-3 py-2 font-mono">
            {help.raw}
          </pre>
        </details>
      )}
    </div>
  )
}

function Subcommands({
  brand,
  subcommands,
  selectedName,
  onSelect,
}: {
  brand: string
  subcommands: CliCommandSubcommand[]
  selectedName?: string
  onSelect: (subcommandName: string) => void
}) {
  const [subcommandQuery, setSubcommandQuery] = useState('')
  const normalizedSubcommandQuery = subcommandQuery.trim().toLowerCase()
  const visibleSubcommands = normalizedSubcommandQuery
    ? subcommands.filter((subcommand) =>
      `${subcommand.name} ${subcommand.desc_zh}`.toLowerCase().includes(normalizedSubcommandQuery)
    )
    : subcommands

  if (subcommands.length === 0) return null

  const selectedExists = visibleSubcommands.some((subcommand) => subcommand.name === selectedName)
  const activeName = selectedExists ? selectedName : undefined
  const activeSubcommand = visibleSubcommands.find((subcommand) => subcommand.name === activeName)

  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-caption font-semibold text-muted-foreground">
          <Command size={14} />
          <span>子命令</span>
          <span className="rounded-sm bg-muted px-2 py-0.5">{subcommands.length}</span>
        </div>
        <div className="relative w-full md:w-64">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="过滤子命令…"
            value={subcommandQuery}
            onChange={(event) => setSubcommandQuery(event.target.value)}
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-2 text-caption placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {visibleSubcommands.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-4 text-caption text-muted-foreground">
          没有匹配的子命令
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={`${brand} 子命令`}
            className="mb-3 flex gap-2 overflow-x-auto pb-1"
          >
            {visibleSubcommands.map((subcommand) => {
              const help = getSubcommandHelp(brand, subcommand.name)
              const isActive = subcommand.name === activeName
              return (
                <button
                  key={`${brand}:${subcommand.name}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${brand}-${subcommand.name}-panel`}
                  onClick={() => onSelect(subcommand.name)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 font-mono text-caption transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted/70',
                  )}
                >
                  <span>{subcommand.name}</span>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      help ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                    )}
                    aria-label={help ? '已采集帮助' : '暂无详细帮助'}
                  />
                </button>
              )
            })}
          </div>

          <div role="tabpanel" id={activeName ? `${brand}-${activeName}-panel` : undefined}>
            {activeSubcommand ? (
              <HelpPanel brand={brand} subcommand={activeSubcommand} />
            ) : (
              <div className="rounded-md border border-dashed border-border px-4 py-4 text-caption text-muted-foreground">
                选择一个子命令查看帮助详情。绿色圆点表示已采集 --help 详情。
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * CliCommandView：
 * - selectedBrand=null/undefined/'' → 展示全部命令
 * - selectedBrand='claude' → 只展示该品牌的命令详情
 * - 搜索只在当前展示范围内生效。
 */
export function CliCommandView({ selectedBrand }: CliCommandViewProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedSubcommands, setSelectedSubcommands] = useState<Record<string, string | undefined>>({})

  // 1) 先按品牌过滤：侧栏选中「全部命令」或未选中时返回全量
  const normalizedSelectedBrand = normalizeSelectedBrand(selectedBrand)

  const scopedCommands = useMemo(() => {
    if (!normalizedSelectedBrand) return COMMANDS
    return COMMANDS.filter((command) => command.brand === normalizedSelectedBrand)
  }, [normalizedSelectedBrand])

  // 2) 再叠加搜索：搜索作用于当前可见范围（侧栏已过滤后的子集）
  const visibleCommands = useMemo(
    () => scopedCommands
      .map((command) => filterCommand(command, query))
      .filter((command): command is CliCommand => command !== null),
    [scopedCommands, query],
  )

  const totalFlags = getTotalFlagCount(scopedCommands)
  const totalSubcommands = getTotalSubcommandCount(scopedCommands)
  const isScoped = normalizedSelectedBrand !== null
  const scopedBrand = normalizedSelectedBrand ?? ''

  function toggleGroup(commandBrand: string, groupName: string) {
    const key = `${commandBrand}:${groupName}`
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function selectSubcommand(commandBrand: string, subcommandName: string) {
    setSelectedSubcommands((current) => ({
      ...current,
      [commandBrand]: current[commandBrand] === subcommandName ? undefined : subcommandName,
    }))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-heading-lg font-semibold text-foreground">
            {isScoped ? (
              <span className="flex items-center gap-2">
                <span className="font-mono text-primary">{scopedBrand}</span>
                <span className="text-muted-foreground">命令</span>
              </span>
            ) : (
              'CLI 命令'
            )}
          </h1>
          <p className="mt-1 max-w-3xl text-body-sm text-muted-foreground">
            {isScoped ? (
              <>该品牌的 flag 与子命令详情，{totalFlags} 个 flag / {totalSubcommands} 个子命令。</>
            ) : (
              <>5 个常用 CLI 的能力地图，覆盖 {totalFlags} 个 flag 和 {totalSubcommands} 个子命令。</>
            )}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder={isScoped ? '搜索当前命令的 flag/子命令/说明…' : '搜索 flag、子命令、说明或命令…'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {visibleCommands.length === 0 ? (
        <div className="detail flex min-h-48 items-center justify-center">
          <p className="text-body-sm text-muted-foreground">
            {isScoped ? '没有匹配的命令能力' : '没有匹配的命令能力'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {visibleCommands.map((command) => (
            <section key={command.brand} className="overflow-hidden rounded-md border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <CommandIcon brand={command.brand} iconBrand={command.iconBrand} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-h4 font-semibold text-foreground">{command.brand}</h2>
                      {command.version && (
                        <span className="rounded-sm bg-muted px-2 py-0.5 text-caption text-muted-foreground">
                          v{command.version}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-body-sm text-muted-foreground">{command.summary_zh}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 text-caption text-muted-foreground">
                  <span className="rounded-sm bg-muted px-2 py-1">{getFlagCount(command)} flags</span>
                  <span className="rounded-sm bg-muted px-2 py-1">
                    {getSubcommandCount(command)} 子命令
                  </span>
                </div>
              </div>

              <Subcommands
                brand={command.brand}
                subcommands={command.subcommands ?? []}
                selectedName={selectedSubcommands[command.brand]}
                onSelect={(subcommandName) => selectSubcommand(command.brand, subcommandName)}
              />

              {command.groups.length > 0 && (
                <div className="divide-y divide-border">
                  {command.groups.map((group) => {
                    const groupKey = `${command.brand}:${group.name_zh}`
                    const isCollapsed = collapsed.has(groupKey)
                    return (
                      <div key={groupKey}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(command.brand, group.name_zh)}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                          aria-expanded={!isCollapsed}
                        >
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          <span className="font-medium text-foreground">{group.name_zh}</span>
                          <span className="rounded-sm bg-muted px-2 py-0.5 text-caption text-muted-foreground">
                            {group.flags.length}
                          </span>
                          <span className="ml-auto text-caption text-muted-foreground">
                            {group.source === 'explicit' ? '原始分组' : '智能分组'}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="px-4 pb-4">
                            <div className="overflow-hidden rounded-md border border-border">
                              {group.flags.map((flag) => (
                                <div
                                  key={`${groupKey}:${flag.name}:${flag.args ?? ''}`}
                                  className={cn(
                                    'grid gap-2 border-b border-border bg-background px-3 py-3 last:border-b-0',
                                    'lg:grid-cols-[minmax(180px,0.9fr)_minmax(0,1.4fr)]',
                                  )}
                                >
                                  <div className="min-w-0">
                                    <code className="break-words rounded-sm bg-muted px-1.5 py-0.5 font-mono text-caption text-primary">
                                      {flag.name}
                                    </code>
                                    {flag.args && (
                                      <div className="mt-1 break-words font-mono text-caption text-muted-foreground">
                                        {flag.args}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-body-sm text-foreground">{flag.desc_zh}</p>
                                    <p className="mt-1 break-words text-caption text-muted-foreground">
                                      {flag.raw}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
