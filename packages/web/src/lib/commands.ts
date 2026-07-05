import commandsData from '@/data/commands.json'
import type { CliCommand } from '@/types'

/** commands.json 一次性加载并冻结；schema 与扫描脚本保持不变。 */
export const COMMANDS = Object.freeze(commandsData as readonly CliCommand[])

/** 单个命令的 flag 总数（所有分组累加）。 */
export function getFlagCount(command: CliCommand): number {
  return command.groups.reduce((total, group) => total + group.flags.length, 0)
}

/** 单个命令的子命令数（subcommands 缺失时计为 0）。 */
export function getSubcommandCount(command: CliCommand): number {
  return command.subcommands?.length ?? 0
}

/** 单个命令品牌的统计摘要（用于侧栏与首页卡片展示）。 */
export interface CommandBrandSummary {
  brand: string
  iconBrand?: string
  version?: string
  summary_zh: string
  flagCount: number
  subcommandCount: number
}

/**
 * 全量命令的品牌聚合统计；模块加载时预算并冻结。
 * 保持 commands.json 的书写顺序，避免每次渲染重新计算。
 */
export const COMMAND_BRAND_SUMMARIES: readonly CommandBrandSummary[] = Object.freeze(
  COMMANDS.map((command) => ({
    brand: command.brand,
    iconBrand: command.iconBrand,
    version: command.version,
    summary_zh: command.summary_zh,
    flagCount: getFlagCount(command),
    subcommandCount: getSubcommandCount(command),
  })),
)

/** 全量命令的 flag 总数。 */
export const TOTAL_FLAG_COUNT: number = COMMAND_BRAND_SUMMARIES.reduce(
  (total, summary) => total + summary.flagCount,
  0,
)

/** 全量命令的子命令总数。 */
export const TOTAL_SUBCOMMAND_COUNT: number = COMMAND_BRAND_SUMMARIES.reduce(
  (total, summary) => total + summary.subcommandCount,
  0,
)

/** 函数式 API 保留：供 scoped 子集（CliCommandView 的 selectedBrand 模式）按需计算。 */
export function getCommandBrandSummaries(
  commands: readonly CliCommand[] = COMMANDS,
): CommandBrandSummary[] {
  return commands.map((command) => ({
    brand: command.brand,
    iconBrand: command.iconBrand,
    version: command.version,
    summary_zh: command.summary_zh,
    flagCount: getFlagCount(command),
    subcommandCount: getSubcommandCount(command),
  }))
}

export function getTotalFlagCount(commands: readonly CliCommand[] = COMMANDS): number {
  return commands.reduce((total, command) => total + getFlagCount(command), 0)
}

export function getTotalSubcommandCount(commands: readonly CliCommand[] = COMMANDS): number {
  return commands.reduce((total, command) => total + getSubcommandCount(command), 0)
}
