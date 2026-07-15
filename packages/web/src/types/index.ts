// 前端镜像后端 IR（packages/scanner/src/types.d.ts 的 SkillItem）。
// 二者需保持同步：后端字段变更时同步此文件。

export type SkillKind =
  | 'skill'
  | 'plugin'
  | 'mcp'
  | 'mcp-tool'
  | 'runbook'
  | 'instruction'
  | 'config'
  | 'doc'
  | 'agent-rule'

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
  editor?: string
  /** 服务端归一后的来源筛选键；editor/source 保留原始扫描来源。 */
  editorKey?: string
  brand?: string
  product?: string
  triggers?: string[]
  tags?: string[]
  paths: {
    abs: string
    rel?: string
    rootKind: 'home' | 'project' | 'icloud'
  }
  preview: string
  /** /api/skills 列表接口会剥离 raw，仅 /api/skills/:id 返回 */
  raw?: string
  links?: { label: string; url: string }[]
  updatedAt: string
  parseError?: string
  plugin?: PluginMetadata
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

// OtherSkill 类型导出 - 前端 Hook 改造后的新类型
export type {
  OtherSkill,
  OtherSkillGroup,
  OtherSkillsOptions,
} from './other-skill'
export {
  OtherSkillCategory,
  SortBy,
  SortOrder,
  GroupBy,
} from './other-skill'
