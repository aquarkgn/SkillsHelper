/**
 * brandIcons.tsx
 * 品牌→lucide 图标组件的映射
 * 用于在 UI 中显示真实的品牌图标而非 emoji
 */

import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Bot,
  Edit2,
  Code,
  Terminal,
  Wand2,
  Wind,
  Play,
  Package,
  Target,
  BookOpen,
  AtSign,
  Sparkles,
  Palette,
  Rocket,
  Star,
  Zap as ThunderBolt,
  Users,
  Globe,
} from 'lucide-react';

/**
 * 品牌→lucide 图标组件映射表
 * 每个品牌对应一个 lucide-react 组件
 */
export const BRAND_ICON_COMPONENTS: Record<string, LucideIcon> = {
  // AI Editors
  hermes: Zap,          // ⚡
  claude: Bot,          // 🤖
  cursor: Edit2,        // 📝
  codex: Code,          // 📚
  'claude-code': Bot,

  // Editors
  vscode: Code,
  vim: Terminal,
  neovim: Sparkles,
  emacs: Palette,
  sublime: Star,
  jetbrains: Rocket,
  nova: Star,
  zed: Zap,
  copilot: Users,
  replit: Globe,
  glot: Globe,

  // AI Tools / Extensions
  codeium: Zap,
  windsurf: Wind,
  continue: Play,
  trae: Target,
  'trae-cn': Target,
  qoder: Package,
  tauri: Package,
};

/**
 * 获取品牌对应的 lucide 图标组件
 * @param brand 品牌名称
 * @returns lucide-react 图标组件
 */
export function getBrandIconComponent(brand: string): LucideIcon {
  return BRAND_ICON_COMPONENTS[brand.toLowerCase()] || Package;
}

/**
 * 获取品牌的显示标签
 * @param brand 品牌名称
 * @returns 显示标签
 */
export function getBrandLabel(brand: string): string {
  const labels: Record<string, string> = {
    hermes: 'Hermes',
    claude: 'Claude',
    'claude-code': 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex',
    vscode: 'VS Code',
    vim: 'Vim',
    neovim: 'Neovim',
    emacs: 'Emacs',
    sublime: 'Sublime Text',
    jetbrains: 'JetBrains',
    nova: 'Nova',
    zed: 'Zed',
    copilot: 'GitHub Copilot',
    replit: 'Replit',
    glot: 'Glot.io',
    codeium: 'Codeium',
    windsurf: 'Windsurf',
    continue: 'Continue',
    trae: 'Trae',
    'trae-cn': 'Trae',
    qoder: 'Qoder',
    tauri: 'Tauri',
  };
  return labels[brand.toLowerCase()] || brand;
}
