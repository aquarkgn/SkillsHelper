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
import type { CliCommand, CliCommandGroup, CliCommandSubcommand } from '@/types'
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
    ...(command.subcommands ?? []).flatMap((subcommand) => [
      subcommand.name,
      subcommand.desc_zh,
    ]),
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
        `${subcommand.name} ${subcommand.desc_zh}`.toLowerCase().includes(normalized)
      )
    if (groups.length === 0 && (!subcommands || subcommands.length === 0)) return null
    return { ...command, groups, subcommands }
  }
  return null
}

function Subcommands({ subcommands }: { subcommands: CliCommandSubcommand[] }) {
  if (subcommands.length === 0) return null
  return (
    <div className="border-t border-border px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-caption font-semibold text-muted-foreground">
        <Command size={14} />
        子命令
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {subcommands.map((subcommand) => (
          <div key={subcommand.name} className="rounded-md bg-muted/60 px-3 py-2">
            <div className="font-mono text-caption text-foreground">{subcommand.name}</div>
            <div className="mt-1 text-caption text-muted-foreground">{subcommand.desc_zh}</div>
          </div>
        ))}
      </div>
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

  // 1) 先按品牌过滤：侧栏选中「全部命令」或未选中时返回全量
  const scopedCommands = useMemo(() => {
    if (!isBrandSelected(selectedBrand)) return COMMANDS
    return COMMANDS.filter((command) => command.brand === selectedBrand)
  }, [selectedBrand])

  // 2) 再叠加搜索：搜索作用于当前可见范围（侧栏已过滤后的子集）
  const visibleCommands = useMemo(
    () => scopedCommands
      .map((command) => filterCommand(command, query))
      .filter((command): command is CliCommand => command !== null),
    [scopedCommands, query],
  )

  const totalFlags = getTotalFlagCount(scopedCommands)
  const totalSubcommands = getTotalSubcommandCount(scopedCommands)
  const isScoped = isBrandSelected(selectedBrand)
  const scopedBrand: string = selectedBrand as string

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
            placeholder={isScoped ? '搜索当前命令的 flag/说明…' : '搜索 flag、说明或命令…'}
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

              <Subcommands subcommands={command.subcommands ?? []} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
