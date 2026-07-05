import claudeHelp from '@/data/command-help/claude.json'
import codeHelp from '@/data/command-help/code.json'
import codexHelp from '@/data/command-help/codex.json'
import gstackHelp from '@/data/command-help/gstack.json'
import hermesHelp from '@/data/command-help/hermes.json'
import type { CliSubcommandHelp } from '@/types'

const BRAND_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  // 历史数据曾误写为 gstach；保留别名避免旧入口失效。
  gstach: 'gstack',
})

const COMMAND_HELP_BY_BRAND: Readonly<Record<string, readonly CliSubcommandHelp[]>> = Object.freeze({
  claude: Object.freeze(claudeHelp as readonly CliSubcommandHelp[]),
  code: Object.freeze(codeHelp as readonly CliSubcommandHelp[]),
  codex: Object.freeze(codexHelp as readonly CliSubcommandHelp[]),
  gstack: Object.freeze(gstackHelp as readonly CliSubcommandHelp[]),
  hermes: Object.freeze(hermesHelp as readonly CliSubcommandHelp[]),
})

function normalizeBrand(brand: string): string {
  return BRAND_ALIASES[brand] ?? brand
}

function splitAliases(name: string): string[] {
  return name
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

/** 返回某个品牌已采集到的一级子命令帮助。 */
export function getSubcommandHelpList(brand: string): readonly CliSubcommandHelp[] {
  return COMMAND_HELP_BY_BRAND[normalizeBrand(brand)] ?? []
}

/** 按子命令名查找帮助；支持 commands.json 中的 plugin|plugins 这类别名写法。 */
export function getSubcommandHelp(brand: string, subcommandName: string): CliSubcommandHelp | undefined {
  const aliases = splitAliases(subcommandName)
  return getSubcommandHelpList(brand).find((help) => aliases.includes(help.subcommand))
}

/** 汇总子命令详情文本，供搜索索引复用。 */
export function getSubcommandHelpSearchText(help: CliSubcommandHelp): string {
  return [
    help.brand,
    help.subcommand,
    help.summary_zh,
    help.usage,
    help.raw,
    ...help.groups.flatMap((group) => [
      group.name_zh,
      group.source,
      ...group.flags.flatMap((flag) => [flag.name, flag.args, flag.desc_zh, flag.raw]),
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function hasSubcommandHelp(brand: string, subcommandName: string): boolean {
  return getSubcommandHelp(brand, subcommandName) !== undefined
}
