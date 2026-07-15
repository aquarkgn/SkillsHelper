// brand-map.mjs — maps a skill/command brand to official icon sources.
//
// 本文件只登记官方来源：本机 .app 的 bundle/appName，或品牌官方网站上的 icon URL。
// 无法确认官方来源的品牌保留 entry 但不配置 officialIconUrls，前端会显示中性占位，
// 避免使用“看起来像官方”的自制 logo。

/**
 * @typedef {object} BrandAppSpec
 * @property {string[]} bundleIds             — candidate CFBundleIdentifier values
 * @property {string[]} appNames              — candidate .app display names (no extension)
 * @property {string[]} [aliases]             — alternate brand keys normalized to this entry
 * @property {string[]} [officialIconPages]   — human-readable official pages documenting source context
 * @property {string[]} [officialIconUrls]    — official HTTPS image URLs eligible for local caching
 * @property {boolean} [remoteIconCache]       — whether remote download/cache is allowed
 * @property {string} [emoji]                 — legacy metadata fallback; UI should prefer neutral placeholder
 */

/** @type {Record<string, BrandAppSpec>} */
export const BRAND_APP_MAP = {
  cursor: {
    bundleIds: ['com.todesktop.230313mzl4w4u92'],
    appNames: ['Cursor'],
    officialIconPages: ['https://cursor.com/'],
    officialIconUrls: ['https://cursor.com/favicon.ico'],
    remoteIconCache: true,
    fingerprints: ['cursor.com', 'cursor.sh'],
    emoji: '🖱️',
  },
  vscode: {
    bundleIds: ['com.microsoft.VSCode', 'com.microsoft.VSCodeInsiders'],
    appNames: ['Visual Studio Code', 'Code', 'Visual Studio Code - Insiders'],
    aliases: ['vs-code', 'code'],
    officialIconPages: ['https://code.visualstudio.com/brand'],
    officialIconUrls: ['https://code.visualstudio.com/assets/apple-touch-icon.png'],
    remoteIconCache: true,
    fingerprints: ['code.visualstudio.com', 'visualstudio.com'],
    emoji: '📝',
  },
  claude: {
    bundleIds: ['com.anthropic.claude', 'com.anthropic.claudefordesktop'],
    appNames: ['Claude'],
    aliases: ['claude-code', 'anthropic'],
    officialIconPages: ['https://claude.ai/', 'https://www.anthropic.com/'],
    officialIconUrls: ['https://claude.ai/favicon.ico'],
    remoteIconCache: true,
    fingerprints: ['claude.ai', 'anthropic.com'],
    emoji: '🤖',
  },
  obsidian: {
    bundleIds: ['md.obsidian'],
    appNames: ['Obsidian'],
    officialIconPages: ['https://obsidian.md/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['obsidian.md'],
    emoji: '🧠',
  },
  docker: {
    bundleIds: ['com.docker.docker'],
    appNames: ['Docker', 'Docker Desktop'],
    officialIconPages: ['https://www.docker.com/products/docker-desktop/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['docker.com'],
    emoji: '🐳',
  },
  // CLI / agent brands. Codex may be available as a local app; no stable official
  // public icon URL is registered here, so remote fallback intentionally stays empty.
  codex: {
    bundleIds: [],
    appNames: ['Codex'],
    officialIconPages: ['https://openai.com/codex/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['openai.com', 'codex.com'],
    emoji: '📋',
  },
  hermes: {
    bundleIds: [],
    appNames: ['Hermes'],
    // 官方图标来源：用户提供的 Hermes Agent icon，已烘焙到本地 public/icons/hermes-{size}.png。
    // 远程抓取成本高且容易命中营销 banner，这里禁用远程回退，只走 localIconBase。
    officialIconPages: [],
    officialIconUrls: [],
    remoteIconCache: false,
    // 本地兜底：web/public/icons/hermes-{size}.png，必须在 dist 中存在
    localIconBase: 'icons/hermes',
    fingerprints: ['hermes-agent.nousresearch.com'],
    emoji: '⚡',
  },
  gstack: {
    bundleIds: [],
    appNames: [],
    officialIconPages: [],
    officialIconUrls: [],
    remoteIconCache: false,
    emoji: '⚡',
  },
  mcp: { bundleIds: [], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: '🔌' },
  google: {
    bundleIds: ['com.google.chrome'],
    appNames: ['Google Chrome', 'Chrome'],
    officialIconPages: ['https://www.google.com/chrome/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['google.com', 'googleapis.com', 'gemini.google.com'],
    emoji: '🌐',
  },
  github: {
    bundleIds: ['com.github.github', 'com.github.GitHubClient'],
    appNames: ['GitHub', 'GitHub Desktop'],
    officialIconPages: ['https://github.com/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['github.com', 'githubusercontent.com'],
    emoji: '🐙',
  },
  notion: {
    bundleIds: ['notion.id'],
    appNames: ['Notion'],
    officialIconPages: ['https://www.notion.com/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['notion.com', 'notion.so'],
    emoji: '📓',
  },
  // 扫描规则 R0 的其余编辑器：仅登记官网可验证的图标 URL；其他品牌仍
  // 优先使用本机官方 .app 图标，无资源时显示中性占位，绝不绘制仿冒图标。
  codeium: { bundleIds: ['com.exafunction.windsurf'], appNames: ['Windsurf'], aliases: ['codeium-windsurf'], officialIconPages: ['https://codeium.com/'], officialIconUrls: ['https://codeium.com/favicon.ico'], remoteIconCache: true },
  windsurf: { bundleIds: ['com.exafunction.windsurf'], appNames: ['Windsurf'], officialIconPages: ['https://windsurf.com/'], officialIconUrls: ['https://windsurf.com/favicon.ico'], remoteIconCache: true },
  continue: { bundleIds: [], appNames: ['Continue'], officialIconPages: ['https://www.continue.dev/'], officialIconUrls: [], remoteIconCache: false },
  tauri: { bundleIds: [], appNames: ['Tauri'], officialIconPages: ['https://tauri.app/'], officialIconUrls: ['https://tauri.app/favicon.svg'], remoteIconCache: true },
  qoder: { bundleIds: [], appNames: ['Qoder'], officialIconPages: ['https://qoder.com/'], officialIconUrls: [], remoteIconCache: false },
  vim: { bundleIds: [], appNames: ['MacVim'], aliases: ['macvim'], officialIconPages: ['https://www.vim.org/'], officialIconUrls: [], remoteIconCache: false },
  neovim: { bundleIds: [], appNames: ['Neovide'], aliases: ['nvim'], officialIconPages: ['https://neovim.io/'], officialIconUrls: ['https://neovim.io/favicon.ico'], remoteIconCache: true },
  emacs: { bundleIds: [], appNames: ['Emacs'], officialIconPages: ['https://www.gnu.org/software/emacs/'], officialIconUrls: ['https://www.gnu.org/favicon.ico'], remoteIconCache: true },
  sublime: { bundleIds: ['com.sublimetext.4'], appNames: ['Sublime Text'], aliases: ['sublime-text'], officialIconPages: ['https://www.sublimetext.com/'], officialIconUrls: ['https://www.sublimetext.com/favicon.ico'], remoteIconCache: true },
  jetbrains: { bundleIds: [], appNames: ['IntelliJ IDEA', 'PyCharm', 'WebStorm', 'GoLand', 'RubyMine', 'CLion'], officialIconPages: ['https://www.jetbrains.com/'], officialIconUrls: ['https://www.jetbrains.com/favicon.ico'], remoteIconCache: true },
  nova: { bundleIds: ['com.panic.Nova'], appNames: ['Nova'], officialIconPages: ['https://nova.app/'], officialIconUrls: ['https://nova.app/favicon.ico'], remoteIconCache: true },
  zed: { bundleIds: ['dev.zed.Zed'], appNames: ['Zed'], officialIconPages: ['https://zed.dev/'], officialIconUrls: [], remoteIconCache: false },
  copilot: { bundleIds: ['com.github.copilot'], appNames: ['GitHub Copilot'], aliases: ['github-copilot'], officialIconPages: ['https://github.com/features/copilot'], officialIconUrls: ['https://github.com/favicon.ico'], remoteIconCache: true },
  replit: { bundleIds: [], appNames: ['Replit'], officialIconPages: ['https://replit.com/'], officialIconUrls: [], remoteIconCache: false },
  glot: { bundleIds: [], appNames: ['Glot'], aliases: ['glot.io'], officialIconPages: ['https://glot.io/'], officialIconUrls: ['https://glot.io/favicon.ico'], remoteIconCache: true },
  // Trae 字节跳动 AI IDE。trae-cn 本机装了 Trae CN.app，走本地 .app 图标提取。
  'trae-cn': {
    bundleIds: ['cn.trae.app'],
    appNames: ['Trae CN'],
    officialIconPages: ['https://www.trae.cn/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['trae.cn'],
    emoji: '🛸',
  },
  trae: {
    bundleIds: ['cn.trae.app'],
    appNames: ['Trae', 'Trae CN'],
    aliases: ['trae-intl'],
    officialIconPages: ['https://www.trae.com/'],
    officialIconUrls: [],
    remoteIconCache: true,
    fingerprints: ['trae.com', 'trae.cn'],
    emoji: '🛸',
  },
  // 仅保留元数据 fallback（无单一可确认官方图标 URL）
  apple: { bundleIds: [], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: '🍎' },
  rust: { bundleIds: [], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: '🦀' },
  python: { bundleIds: [], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: '🐍' },
  suno: { bundleIds: [], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: '🎵' },
};

const ALIAS_TO_CANONICAL = new Map();
for (const [brand, spec] of Object.entries(BRAND_APP_MAP)) {
  ALIAS_TO_CANONICAL.set(brand, brand);
  for (const alias of spec.aliases || []) {
    ALIAS_TO_CANONICAL.set(alias.toLowerCase().trim(), brand);
  }
}

/**
 * Normalize a brand/source key to the canonical manifest key.
 * @param {string} key
 * @returns {string | null}
 */
export function normalizeBrandKey(key) {
  if (!key) return null;
  const normalized = String(key).toLowerCase().trim();
  return ALIAS_TO_CANONICAL.get(normalized) || (BRAND_APP_MAP[normalized] ? normalized : null);
}

/**
 * Resolve a brand/source key (or a raw bundle id) into a lookup spec.
 * A value containing a dot is treated as an explicit bundle id.
 * @param {string} key
 * @returns {BrandAppSpec | null}
 */
export function resolveBrandSpec(key) {
  if (!key) return null;
  const canonical = normalizeBrandKey(key);
  if (canonical && BRAND_APP_MAP[canonical]) return BRAND_APP_MAP[canonical];
  // Looks like a bundle identifier (e.g. "com.microsoft.VSCode")
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(key)) {
    return { bundleIds: [key], appNames: [], officialIconUrls: [], remoteIconCache: false, emoji: undefined };
  }
  return null;
}

/**
 * Emoji fallback metadata for a brand/source key.
 * @param {string} key
 * @returns {string | undefined}
 */
export function emojiForBrand(key) {
  const canonical = normalizeBrandKey(key);
  return canonical ? BRAND_APP_MAP[canonical]?.emoji : undefined;
}

// ───────────────────────── provider fingerprint (v0.4) ──────────────────────
// 对标 cockpit-tools codexProviderPresets 的 baseUrl 规范化匹配，补一层
// hostname suffix 匹配，让反代/多 region 场景也能命中正确品牌，而不是
// 一律回退 custom。本模块保持纯数据/纯函数，不读文件；用户手动覆写由
// 调用方（icon-extractor）注入 overrides 参数。

/**
 * 从 URL 或裸 hostname 提取小写 hostname。
 * @param {string} urlOrHost - URL 或 hostname
 * @returns {string | null}
 */
export function extractHostname(urlOrHost) {
  if (!urlOrHost) return null;
  const s = String(urlOrHost).trim().toLowerCase();
  if (!s) return null;
  // 带 scheme
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * 按 hostname suffix 多层匹配品牌。
 *
 * 匹配层级（优先级从高到低）：
 *   1. 用户 overrides（hostnameSuffix -> brand，由调用方注入）
 *   2. BRAND_APP_MAP 各项的 fingerprints（hostname suffix 匹配，支持多级子域）
 *   3. 无匹配返回 null（调用方可回退 custom）
 *
 * @param {string} urlOrHost - URL 或 hostname
 * @param {Record<string, string>} [overrides] - 用户手动覆写：{ hostnameSuffix: brandKey }
 * @returns {string | null} canonical brand key
 */
export function resolveBrandByFingerprint(urlOrHost, overrides) {
  const host = extractHostname(urlOrHost);
  if (!host) return null;

  // 1. 用户 overrides 优先（精确匹配，再 suffix 匹配）
  if (overrides && typeof overrides === 'object') {
    if (overrides[host]) {
      const canonical = normalizeBrandKey(overrides[host]);
      if (canonical) return canonical;
    }
    for (const [suffix, brand] of Object.entries(overrides)) {
      if (host === suffix || host.endsWith(`.${suffix}`)) {
        const canonical = normalizeBrandKey(brand);
        if (canonical) return canonical;
      }
    }
  }

  // 2. BRAND_APP_MAP fingerprints：hostname suffix 匹配
  //    host === 'claude.ai' 或 host.endsWith('.claude.ai') 均命中 claude
  for (const [brand, spec] of Object.entries(BRAND_APP_MAP)) {
    const fps = spec.fingerprints;
    if (!fps || !fps.length) continue;
    for (const suffix of fps) {
      const s = String(suffix).toLowerCase().trim();
      if (host === s || host.endsWith(`.${s}`)) {
        return brand;
      }
    }
  }

  return null;
}
