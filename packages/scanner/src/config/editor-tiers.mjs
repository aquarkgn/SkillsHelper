/**
 * @file editor-tiers.mjs
 * 22个编辑器工具的配置，按优先级排序
 * 用于第1层扫描的路径和品牌映射
 */

/**
 * Tier 1：22 个编辑器工具（按优先级）
 */
export const EDITOR_TIER_1_CONFIGS = [
  {
    id: 1,
    brand: 'hermes',
    name: 'Hermes',
    globalPath: '~/.hermes/skills',
    projectPath: '.hermes/skills',
  },
  {
    id: 2,
    brand: 'claude',
    name: 'Claude',
    globalPath: '~/.claude/skills',
    projectPath: '.claude/skills',
  },
  {
    id: 3,
    brand: 'cursor',
    name: 'Cursor',
    globalPath: '~/.cursor/skills',
    projectPath: '.cursor/skills',
  },
  {
    id: 4,
    brand: 'vscode',
    name: 'VSCode',
    globalPath: '~/.vscode/skills',
    projectPath: '.vscode/skills',
  },
  {
    id: 5,
    brand: 'codeium',
    name: 'Codeium',
    globalPath: '~/.codeium/skills',
    projectPath: '.codeium/skills',
  },
  {
    id: 6,
    brand: 'windsurf',
    name: 'Windsurf',
    globalPath: '~/.windsurf/skills',
    projectPath: '.windsurf/skills',
  },
  {
    id: 7,
    brand: 'continue',
    name: 'Continue',
    globalPath: '~/.continue/skills',
    projectPath: '.continue/skills',
  },
  {
    id: 8,
    brand: 'tauri',
    name: 'Tauri',
    globalPath: '~/.tauri/skills',
    projectPath: '.tauri/skills',
  },
  {
    id: 9,
    brand: 'trae',
    name: 'Trae',
    globalPath: '~/.trae/skills',
    projectPath: '.trae/skills',
  },
  {
    id: 10,
    brand: 'trae-cn',
    name: 'Trae-CN',
    globalPath: '~/.trae-cn/skills',
    projectPath: '.trae-cn/skills',
  },
  {
    id: 11,
    brand: 'qoder',
    name: 'QoDer',
    globalPath: '~/.qoder/skills',
    projectPath: '.qoder/skills',
  },
  {
    id: 12,
    brand: 'codex',
    name: 'Codex',
    globalPath: '~/.codex/skills',
    projectPath: '.codex/skills',
  },
  {
    id: 13,
    brand: 'vim',
    name: 'Vim',
    globalPath: '~/.vim/skills',
    projectPath: '.vim/skills',
  },
  {
    id: 14,
    brand: 'neovim',
    name: 'Neovim',
    globalPath: '~/.config/nvim/skills',
    projectPath: '.nvim/skills',
  },
  {
    id: 15,
    brand: 'emacs',
    name: 'Emacs',
    globalPath: '~/.emacs.d/skills',
    projectPath: '.emacs.d/skills',
  },
  {
    id: 16,
    brand: 'sublime',
    name: 'Sublime',
    globalPath: '~/.config/sublime-text/skills',
    projectPath: '.sublime-text/skills',
  },
  {
    id: 17,
    brand: 'jetbrains',
    name: 'Jetbrains IDE',
    globalPath: '~/.config/JetBrains/skills',
    projectPath: '.jetbrains/skills',
  },
  {
    id: 18,
    brand: 'nova',
    name: 'Nova',
    globalPath: '~/.nova/skills',
    projectPath: '.nova/skills',
  },
  {
    id: 19,
    brand: 'zed',
    name: 'Zed',
    globalPath: '~/.config/zed/skills',
    projectPath: '.zed/skills',
  },
  {
    id: 20,
    brand: 'copilot',
    name: 'GitHub Copilot',
    globalPath: '~/.copilot/skills',
    projectPath: '.copilot/skills',
  },
  {
    id: 21,
    brand: 'replit',
    name: 'Replit',
    globalPath: '~/.replit/skills',
    projectPath: '.replit/skills',
  },
  {
    id: 22,
    brand: 'glot',
    name: 'Glot.io',
    globalPath: '~/.glot/skills',
    projectPath: '.glot/skills',
  },
];

/**
 * Tier 2：用户根目录技能库
 */
export const USER_TIER_2_CONFIG = {
  name: 'My Skills Library',
  globalPath: '~/skills', // 支持 ~/Skills / ~/SKILLS 等大小写变体
};

/**
 * Tier 3：其他位置（可选扫描）
 */
export const OTHER_TIER_3_CONFIGS = [
  {
    name: 'System Opt',
    path: '/opt',
  },
  {
    name: 'Homebrew',
    path: '/usr/local',
  },
  {
    name: 'User Opt',
    path: '~/opt',
  },
];
