import {
  Sparkles,
  Terminal,
  Bot,
  Code2,
  Wind,
  Ghost,
  Cpu,
  Boxes,
  type LucideIcon,
} from 'lucide-react'
import type { SkillItem } from '@/types'

/**
 * editor 元数据映射（D2：导航/筛选主轴 = editor，非 brand）。
 * editor 取值来自 Stats.byEditor 的 key（it.editor || it.source || '(none)'），
 * 形如 "Claude Code" / "Hermes Agent" / "Cursor" / "codex" / "(none)"。
 *
 * 按关键字归一着色取图标；未知/缺失走兜底（C6：(none) 由调用方过滤或标注）。
 */
export interface EditorMeta {
  label: string
  /** 品牌色（hex），用于图标前景 + 半透明底 */
  color: string
  icon: LucideIcon
  /** 用于 /api/icons 的官方图标 brand key；为空时显示中性占位。 */
  iconBrand?: string
}

interface Rule {
  test: RegExp
  color: string
  icon: LucideIcon
  iconBrand?: string
}

// 关键字优先匹配（顺序敏感：更具体的放前面）
const RULES: Rule[] = [
  { test: /^my-skills$/i, color: '#10B981', icon: Boxes },
  { test: /^other-skills$/i, color: '#8B5CF6', icon: Sparkles },
  { test: /claude|anthropic/i, color: '#D97757', icon: Sparkles, iconBrand: 'claude' },
  { test: /codex|openai/i, color: '#10A37F', icon: Cpu, iconBrand: 'codex' },
  { test: /hermes/i, color: '#4A5FC7', icon: Bot, iconBrand: 'hermes' },
  { test: /cursor/i, color: '#1F2937', icon: Code2, iconBrand: 'cursor' },
  { test: /windsurf/i, color: '#10B6C4', icon: Wind, iconBrand: 'windsurf' },
  { test: /kiro/i, color: '#8B5CF6', icon: Ghost },
  { test: /copilot|github/i, color: '#24292F', icon: Terminal, iconBrand: 'github' },
  { test: /gemini/i, color: '#4285F4', icon: Sparkles, iconBrand: 'google' },
  { test: /mcp/i, color: '#2563EB', icon: Boxes },
]

const FALLBACK: Omit<EditorMeta, 'label'> = { color: '#6B7280', icon: Boxes }
const LABELS: Record<string, string> = {
  'my-skills': '我的技能',
  'other-skills': '其它技能',
}

/** 是否为「无归属」桶（C6）——调用方据此过滤或标注「未分类」。 */
export function isNoneEditor(key: string): boolean {
  return !key || key === '(none)' || key.toLowerCase() === 'none'
}

/** 单条目的 editor 归属 key，与 server buildStats 口径一致（it.editor || it.source || '(none)'）。 */
export function itemEditorKey(it: SkillItem): string {
  return it.editor || it.source || '(none)'
}

/** 把原始 editor key 转为展示用 label（(none) → 未分类）。 */
export function editorLabel(key: string): string {
  if (isNoneEditor(key)) return '未分类'
  return LABELS[key.toLowerCase()] ?? key
}

export function getEditorMeta(key: string): EditorMeta {
  const label = editorLabel(key)
  for (const r of RULES) {
    if (r.test.test(key)) return { label, color: r.color, icon: r.icon, iconBrand: r.iconBrand }
  }
  return { label, ...FALLBACK }
}
