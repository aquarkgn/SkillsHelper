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

export interface SkillItem {
  id: string
  kind: SkillKind
  source: string
  name: string
  title?: string
  description?: string
  category?: string
  editor?: string
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
// OtherSkill 类型导出
export type { OtherSkill, OtherSkillGroup } from './other-skill'
export { OtherSkillCategory } from './other-skill'
