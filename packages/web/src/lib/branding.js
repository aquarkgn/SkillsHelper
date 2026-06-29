// 数据源品牌配置
export const SOURCE_BRANDING = {
  hermes: {
    icon: '⚙️',
    color: '#8B5CF6',
    label: 'Hermes',
    description: 'Hermes Agent 技能库'
  },
  skills: {
    icon: '⭐',
    color: '#F59E0B',
    label: '用户技能',
    description: '本地自定义技能'
  },
  cursor: {
    icon: '✏️',
    color: '#EC4899',
    label: 'Cursor',
    description: 'Cursor 编辑器规则'
  },
  'claude-code': {
    icon: '💻',
    color: '#3B82F6',
    label: 'Claude Code',
    description: 'Claude Code 技能'
  },
  'project-runbook': {
    icon: '📖',
    color: '#06B6D4',
    label: '项目文档',
    description: '项目相关文档'
  },
  'mcp-config': {
    icon: '⚡',
    color: '#14B8A6',
    label: 'MCP',
    description: 'MCP 协议配置'
  }
};

// 已知品牌的配色映射
export const BRAND_COLORS = {
  'GitHub': '#24292E',
  'Apple': '#A1AAAD',
  'Google': '#4285F4',
  'Microsoft': '#0078D4',
  'OpenAI': '#10A37F',
  'Anthropic': '#9ACD32',
  'Hermes': '#8B5CF6',
  'Docker': '#2496ED',
  'Kubernetes': '#326CE5',
};

// 辅助函数
export function getSourceBranding(source) {
  return SOURCE_BRANDING[source] || {
    icon: '📦',
    color: '#6B7280',
    label: source,
    description: source
  };
}

export function getBrandColor(brand) {
  return BRAND_COLORS[brand] || '#9CA3AF';
}
