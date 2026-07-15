// 静态枚举映射表 —— 有限闭集字段的中文化（kind / tier / brand）。
// 数据来源对齐 packages/server/src/labels.mjs，单一来源避免多处重复。
// 自由文本字段（description / preview / raw）走在线翻译，不在此处。
//
// 品牌名按业界惯例保留英文（Hermes / Claude / Cursor / Codex），
// 翻译反而造成混乱。

export const KIND_LABEL: Record<string, string> = {
  skill: '技能',
  plugin: '插件',
  mcp: 'MCP',
  'mcp-tool': 'MCP 工具',
  runbook: '手册',
  instruction: '规则',
  config: '配置',
  doc: '文档',
  'agent-rule': 'Agent 规则',
}

export const TIER_LABEL: Record<string, string> = {
  tool: '官方工具',
  directory: '自定义技能',
  other: '其它技能',
  'tier-1': '官方工具',
  'tier-2': '自定义技能',
  'tier-3': '其它技能',
}

// 品牌名保留英文，仅做大小写规范化
export const BRAND_LABEL: Record<string, string> = {
  hermes: 'Hermes',
  claude: 'Claude',
  cursor: 'Cursor',
  codex: 'Codex',
  vscode: 'VSCode',
  windsurf: 'Windsurf',
  continue: 'Continue',
}

const PLUGIN_CAPABILITY_LABEL: Record<string, string> = {
  skill: '技能',
  mcp: 'MCP 服务',
  app: '应用',
  interactive: '可交互',
  write: '可写入',
}

const PLUGIN_CATEGORY_LABEL: Record<string, string> = {
  productivity: '效率工具',
}

const PLUGIN_KEYWORD_LABEL: Record<string, string> = {
  build: '构建',
  deploy: '部署',
  sites: '建站',
  website: '网站',
  'landing page': '落地页',
  portfolio: '作品集',
  dashboard: '仪表盘',
  'kpi dashboard': 'KPI 仪表盘',
  portal: '门户',
  tracker: '追踪',
  hub: '中心',
  'internal tool': '内部工具',
  games: '游戏',
}

function staticPluginDescription(item: {
  name?: string
  description?: string
  plugin?: unknown
}): string {
  if (!item.plugin || !item.description) return ''
  if (item.name === 'sites' && /build and deploy websites with sites/i.test(item.description)) {
    return '使用 Sites 构建和部署网站'
  }
  return ''
}

export function kindLabel(kind?: string): string {
  if (!kind) return ''
  return KIND_LABEL[kind] ?? kind
}

export function tierLabel(tier?: string): string {
  if (!tier) return ''
  return TIER_LABEL[tier] ?? tier
}

export function brandLabel(brand?: string): string {
  if (!brand) return ''
  return BRAND_LABEL[brand] ?? brand
}

export function pluginCapabilityLabel(capability: { kind: string; count?: number }): string {
  const label = PLUGIN_CAPABILITY_LABEL[capability.kind] ?? capability.kind
  return capability.count && capability.count > 1 ? `${label} ${capability.count}` : label
}

export function pluginCategoryLabel(category?: string): string {
  if (!category) return ''
  return PLUGIN_CATEGORY_LABEL[category.toLowerCase()] ?? category
}

export function pluginSearchText(item: {
  plugin?: { capabilities?: Array<{ kind: string; count?: number }>; category?: string }
  tags?: string[]
}): string {
  if (!item.plugin) return ''
  const capabilityText = (item.plugin.capabilities ?? []).map(pluginCapabilityLabel)
  const category = pluginCategoryLabel(item.plugin.category)
  const translatedTags = (item.tags ?? []).map((tag) => PLUGIN_KEYWORD_LABEL[tag.toLowerCase()] ?? '')
  return [...capabilityText, category, ...translatedTags].filter(Boolean).join(' ').toLowerCase()
}

// 翻译展示开关（localStorage）—— 控制前端是否优先展示译文。
// 后端默认补译，SKILLHELPER_TRANSLATE=0 可关闭；前端开关控制是否展示。
// 默认启用（用户要求中文化）。
const TRANSLATE_DISPLAY_KEY = 'skillhelper_translate_display'

export function isTranslateDisplayEnabled(): boolean {
  try {
    const v = localStorage.getItem(TRANSLATE_DISPLAY_KEY)
    return v === null ? true : v === '1' // 默认启用
  } catch {
    return true
  }
}

export function setTranslateDisplayEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(TRANSLATE_DISPLAY_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

/**
 * 取技能描述：启用翻译展示时优先返回译文，否则返回原文。
 */
export function displayDescription(item: {
  name?: string
  description?: string
  plugin?: unknown
  i18n?: { zh?: { description?: string } }
}): string {
  const original = item.description || ''
  if (!isTranslateDisplayEnabled()) return original
  return item.i18n?.zh?.description || staticPluginDescription(item) || original
}

export function pluginDescriptionFallback(item: {
  name?: string
  description?: string
  plugin?: unknown
}): string {
  return staticPluginDescription(item)
}
