/**
 * 其它技能分类枚举
 */
export enum OtherSkillCategory {
  COMMAND = 'command',      // CLI 命令
  EDITOR = 'editor',        // 编辑器集成
  TOOL = 'tool',            // 工具/插件
  CLOUD = 'cloud',          // 云服务
  AI = 'ai',                // AI 能力
}

/**
 * 其它技能项
 */
export interface OtherSkill {
  id: string
  name: string
  category: OtherSkillCategory
  description: string
  icon?: string
  tags: string[]
  docs?: string      // 文档链接
  examples?: string[] // 使用示例
}

/**
 * 其它技能分组（按分类）
 */
export interface OtherSkillGroup {
  category: OtherSkillCategory
  label: string
  icon: string
  items: OtherSkill[]
}
