// 品牌资产注册表是来源品牌身份的唯一事实来源。它不包含 favicon、远程图片或 emoji。

export const BRAND_ASSET_ROOT = '/brand-assets';

const PENDING = 'pending-redistribution-review';

/** @type {Readonly<Record<string, {id: string, label: string, aliases: readonly string[], bundleIds: readonly string[], fingerprints: readonly string[], assetStatus: 'verified'|'pending-redistribution-review', asset?: {id: string, file: string, sha256: string, sourceUrl: string, verifiedAt: string, usageNote: string}, sourceUrl: string}>>} */
export const BRAND_REGISTRY = Object.freeze({
  hermes: { id: 'hermes', label: 'Hermes', aliases: ['hermes-agent', 'hermes-plugin'], bundleIds: [], fingerprints: ['hermes-agent.nousresearch.com'], assetStatus: 'verified', asset: { id: 'hermes-v1', file: 'icons/hermes-64.png', sha256: 'f5fe197a3caf204ed9e98e079a37b9807a7bde37426891cd7770cd1638f1257b', sourceUrl: 'https://hermes-agent.nousresearch.com/', verifiedAt: '2026-07-15', usageNote: '项目随附的 Hermes 产品图标，构建期校验 SHA-256。' }, sourceUrl: 'https://hermes-agent.nousresearch.com/' },
  claude: { id: 'claude', label: 'Claude Code', aliases: ['claude-code', 'anthropic', 'anthropic-claude', 'claude-agents', 'claude-plugin'], bundleIds: ['com.anthropic.claude', 'com.anthropic.claudefordesktop'], fingerprints: ['claude.ai', 'anthropic.com'], assetStatus: 'verified', asset: { id: 'claude-macos-v1', file: 'brand-assets/claude.png', sha256: 'f3889e0ac9a0010c7d13bba6798fc855e7997aba672b5fbb59fe1256387671b1', sourceUrl: 'https://claude.ai/', verifiedAt: '2026-07-15', usageNote: '从已安装的官方 Claude.app（com.anthropic.claudefordesktop）提取的应用图标。' }, sourceUrl: 'https://www.anthropic.com/' },
  cursor: { id: 'cursor', label: 'Cursor', aliases: ['cursor.sh'], bundleIds: ['com.todesktop.230313mzl4w4u92'], fingerprints: ['cursor.com', 'cursor.sh'], assetStatus: 'verified', asset: { id: 'cursor-macos-v1', file: 'brand-assets/cursor.png', sha256: 'a2d83913831f1002df008fabc91cbfce181a61e79dc0d3237f96c52b813f57a0', sourceUrl: 'https://cursor.com/', verifiedAt: '2026-07-15', usageNote: '从已安装的官方 Cursor.app（com.todesktop.230313mzl4w4u92）提取的应用图标。' }, sourceUrl: 'https://cursor.com/' },
  vscode: { id: 'vscode', label: 'Visual Studio Code', aliases: ['vs-code', 'code'], bundleIds: ['com.microsoft.VSCode', 'com.microsoft.VSCodeInsiders'], fingerprints: ['code.visualstudio.com', 'visualstudio.com'], assetStatus: 'verified', asset: { id: 'vscode-macos-v1', file: 'brand-assets/vscode.png', sha256: 'f53cf5dab668141e911ccf9ec652332d3b15767b5842fd54b176485d72933a60', sourceUrl: 'https://code.visualstudio.com/brand', verifiedAt: '2026-07-15', usageNote: '从已安装的官方 Visual Studio Code.app（com.microsoft.VSCode）提取的应用图标。' }, sourceUrl: 'https://code.visualstudio.com/brand' },
  codeium: { id: 'codeium', label: 'Codeium', aliases: ['codeium-windsurf'], bundleIds: [], fingerprints: ['codeium.com'], assetStatus: PENDING, sourceUrl: 'https://codeium.com/' },
  windsurf: { id: 'windsurf', label: 'Windsurf', aliases: [], bundleIds: ['com.exafunction.windsurf'], fingerprints: ['windsurf.com'], assetStatus: PENDING, sourceUrl: 'https://windsurf.com/' },
  continue: { id: 'continue', label: 'Continue', aliases: ['continue.dev'], bundleIds: [], fingerprints: ['continue.dev'], assetStatus: PENDING, sourceUrl: 'https://www.continue.dev/' },
  tauri: { id: 'tauri', label: 'Tauri', aliases: [], bundleIds: [], fingerprints: ['tauri.app'], assetStatus: PENDING, sourceUrl: 'https://tauri.app/' },
  trae: { id: 'trae', label: 'Trae', aliases: ['trae-intl'], bundleIds: ['com.trae.app'], fingerprints: ['trae.com'], assetStatus: PENDING, sourceUrl: 'https://www.trae.com/' },
  'trae-cn': { id: 'trae-cn', label: 'Trae CN', aliases: [], bundleIds: ['cn.trae.app'], fingerprints: ['trae.cn'], assetStatus: 'verified', asset: { id: 'trae-cn-macos-v1', file: 'brand-assets/trae-cn.png', sha256: 'b2309f527091d2807489239feca72720c1fde192c7f5fd2cb82a11482a24e87a', sourceUrl: 'https://www.trae.cn/', verifiedAt: '2026-07-15', usageNote: '从已安装的官方 Trae CN.app（cn.trae.app）提取的应用图标。' }, sourceUrl: 'https://www.trae.cn/' },
  qoder: { id: 'qoder', label: 'Qoder', aliases: [], bundleIds: [], fingerprints: ['qoder.com'], assetStatus: PENDING, sourceUrl: 'https://qoder.com/' },
  codex: { id: 'codex', label: 'Codex', aliases: ['openai', 'chatgpt', 'chatgpt-codex'], bundleIds: [], fingerprints: ['openai.com', 'codex.com'], assetStatus: 'verified', asset: { id: 'codex-macos-v1', file: 'brand-assets/codex.png', sha256: '1ecca96720bcb54a6ddb2d4f0604731f9e1633ef9da4d0f8c535d508b207a34a', sourceUrl: 'https://openai.com/codex/', verifiedAt: '2026-07-15', usageNote: '从已安装的官方 ChatGPT.app 中的 Codex 产品图标提取。' }, sourceUrl: 'https://openai.com/codex/' },
  vim: { id: 'vim', label: 'Vim', aliases: ['macvim'], bundleIds: ['org.vim.MacVim'], fingerprints: ['vim.org'], assetStatus: PENDING, sourceUrl: 'https://www.vim.org/' },
  neovim: { id: 'neovim', label: 'Neovim', aliases: ['nvim'], bundleIds: ['com.neovide.neovide'], fingerprints: ['neovim.io'], assetStatus: PENDING, sourceUrl: 'https://neovim.io/' },
  emacs: { id: 'emacs', label: 'Emacs', aliases: [], bundleIds: ['org.gnu.Emacs'], fingerprints: ['gnu.org'], assetStatus: PENDING, sourceUrl: 'https://www.gnu.org/software/emacs/' },
  sublime: { id: 'sublime', label: 'Sublime Text', aliases: ['sublime-text'], bundleIds: ['com.sublimetext.4'], fingerprints: ['sublimetext.com'], assetStatus: PENDING, sourceUrl: 'https://www.sublimetext.com/' },
  jetbrains: { id: 'jetbrains', label: 'JetBrains IDE', aliases: ['intellij', 'pycharm', 'webstorm'], bundleIds: ['com.jetbrains.intellij', 'com.jetbrains.pycharm', 'com.jetbrains.webstorm'], fingerprints: ['jetbrains.com'], assetStatus: PENDING, sourceUrl: 'https://www.jetbrains.com/company/brand/' },
  nova: { id: 'nova', label: 'Nova', aliases: [], bundleIds: ['com.panic.Nova'], fingerprints: ['nova.app'], assetStatus: PENDING, sourceUrl: 'https://nova.app/' },
  zed: { id: 'zed', label: 'Zed', aliases: [], bundleIds: ['dev.zed.Zed'], fingerprints: ['zed.dev'], assetStatus: PENDING, sourceUrl: 'https://zed.dev/' },
  copilot: { id: 'copilot', label: 'GitHub Copilot', aliases: ['github-copilot'], bundleIds: ['com.github.copilot'], fingerprints: ['github.com'], assetStatus: PENDING, sourceUrl: 'https://github.com/logos' },
  replit: { id: 'replit', label: 'Replit', aliases: [], bundleIds: [], fingerprints: ['replit.com'], assetStatus: PENDING, sourceUrl: 'https://replit.com/' },
  glot: { id: 'glot', label: 'Glot.io', aliases: ['glot.io'], bundleIds: [], fingerprints: ['glot.io'], assetStatus: PENDING, sourceUrl: 'https://glot.io/' },
  openclaw: { id: 'openclaw', label: 'OpenClaw', aliases: [], bundleIds: [], fingerprints: ['openclaw.ai'], assetStatus: 'verified', asset: { id: 'openclaw-web-v1', file: 'brand-assets/openclaw.svg', sha256: 'fa7e2ec07ebfa696bcc8c27d7e36425cbb7b1772f6f7f04ce390cf5f1c35cf0e', sourceUrl: 'https://openclaw.ai/favicon.svg', verifiedAt: '2026-07-15', usageNote: '从 OpenClaw 官方域名公开的产品图标 SVG 固化。' }, sourceUrl: 'https://openclaw.ai/' },
});

const aliases = new Map();
const bundleIds = new Map();
for (const entry of Object.values(BRAND_REGISTRY)) {
  for (const value of [entry.id, ...entry.aliases]) aliases.set(value.toLowerCase(), entry.id);
  for (const value of entry.bundleIds) bundleIds.set(value.toLowerCase(), entry.id);
}

export function normalizeBrandKey(value) {
  if (!value) return null;
  return aliases.get(String(value).trim().toLowerCase()) ?? null;
}

export function brandForBundleId(value) {
  if (!value) return null;
  return bundleIds.get(String(value).trim().toLowerCase()) ?? null;
}

export function resolveBrandEntry(value) {
  const id = normalizeBrandKey(value);
  return id ? BRAND_REGISTRY[id] : null;
}

export function resolveBrandByHostname(value) {
  if (!value) return null;
  let hostname = String(value).trim().toLowerCase();
  try { hostname = new URL(hostname.includes('://') ? hostname : `https://${hostname}`).hostname; } catch { return null; }
  for (const entry of Object.values(BRAND_REGISTRY)) {
    if (entry.fingerprints.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) return entry.id;
  }
  return null;
}

/** 原始扫描字段的固定归因优先级：显式来源 > 编辑器 > 来源名 > 主机名。 */
export function resolveSourceBrand({ sourceBrand, editorBrand, editor, source, hostname } = {}) {
  for (const value of [sourceBrand, editorBrand, editor, source]) {
    const id = normalizeBrandKey(value);
    if (id) return id;
  }
  return resolveBrandByHostname(hostname);
}

export function resolveIconRef(input = {}) {
  const brandId = resolveSourceBrand(input);
  const entry = brandId ? BRAND_REGISTRY[brandId] : null;
  if (!entry) return { kind: 'neutral', reason: 'unknown-brand' };
  if (!entry.asset || entry.assetStatus !== 'verified') return { kind: 'neutral', reason: 'asset-unavailable' };
  return { kind: 'asset', brandId, assetId: entry.asset.id, src: `/${entry.asset.file}` };
}
