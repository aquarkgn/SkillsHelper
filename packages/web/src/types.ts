// 前端镜像后端 IR（packages/scanner/src/types.d.ts 的 SkillItem）。
// 二者需保持同步：后端字段变更时同步此文件。

export type SkillKind =
  | 'skill'
  | 'plugin'
  | 'mcp'
  | 'runbook'
  | 'doc'

export type PluginCapabilityKind = 'skill' | 'mcp' | 'app' | 'interactive' | 'write'

export interface PluginCapability {
  kind: PluginCapabilityKind
  label: string
  count?: number
}

export interface PluginMetadata {
  manifestPath: string
  version?: string
  author?: string
  homepage?: string
  category?: string
  capabilities: PluginCapability[]
  defaultPrompts?: string[]
  logoPath?: string
}

export interface SkillItem {
  id: string
  kind: SkillKind
  source: string
  name: string
  title?: string
  description?: string
  category?: string | string[]
  tier?: string
  brand?: string
  dirName?: string
  editor?: string
  /** 服务端归一后的来源筛选键；editor/source 保留原始扫描来源。 */
  editorKey?: string
  product?: string
  triggers?: string[]
  tags?: string[]
  paths?: {
    abs: string
    rel?: string
    rootKind: 'home' | 'project' | 'icloud'
  }
  preview?: string
  /** /api/skills 列表接口会剥离 raw，仅 /api/skills/:id 返回 */
  raw?: string
  links?: { label: string; url: string }[]
  updatedAt?: string
  parseError?: string

  /**
   * i18n 翻译结果（仅 description 走在线翻译，name 保持原英文）。
   * 后端在 SKILLHELPER_TRANSLATE=1 时按需填充；缓存命中的也在列表接口返回。
   */
  i18n?: {
    zh?: {
      description?: string
      title?: string
      name?: string
    }
    translatedAt?: string
  }

  // v4.0 Priority Scan & Menu Layering
  /** MD5(normalizedAbsPath) — 用于去重和菜单分层 */
  pathHash?: string
  /** v4.0 tier 分层：tier-1（编辑器）| tier-2（用户）| tier-3（其他） */
  tierId?: 'tier-1' | 'tier-2' | 'tier-3'
  /** v4.0 editor brand within Tier 1 (cursor, claude, hermes, etc.) */
  editorBrand?: string
  /** 真实应用图标 URL（从 /api/icons/:brand） */
  iconUrl?: string
  /** emoji 兜底值 */
  iconFallback?: string
  /** Codex 等本地插件的安全结构化元数据，不含 MCP 配置正文。 */
  plugin?: PluginMetadata
}

export interface Stats {
  total: number
  bySource: Record<string, number>
  byEditor: Record<string, number>
  byKind: Record<string, number>
  byCategory: Record<string, number>
  byBrand: Record<string, number>
  labels?: Record<string, unknown>
}

export interface CliCommandFlag {
  name: string
  args?: string
  desc_zh: string
  raw: string
}

export interface CliCommandGroup {
  name_zh: string
  source: 'inferred' | 'explicit'
  flags: CliCommandFlag[]
}

export interface CliCommandSubcommand {
  name: string
  desc_zh: string
  /** 子命令详情采集状态：ready 可查看完整 help；missing 暂无详情；failed 采集失败。 */
  helpStatus?: 'ready' | 'missing' | 'failed'
}

export interface CliCommandHelpGroup {
  name_zh: string
  source: 'inferred' | 'explicit'
  flags: CliCommandFlag[]
}

export interface CliSubcommandHelp {
  brand: string
  subcommand: string
  summary_zh: string
  usage?: string
  groups: CliCommandHelpGroup[]
  raw?: string
  capturedAt?: string
  sourcePath?: string
}

export interface CliCommand {
  brand: string
  iconBrand?: string
  version?: string
  summary_zh: string
  groups: CliCommandGroup[]
  subcommands?: CliCommandSubcommand[]
  /** 顶层命令 --help 原始文本，用于原始 help Tab 校对。 */
  raw?: string
  capturedAt?: string
  sourcePath?: string
}
