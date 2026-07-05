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
    officialIconUrls: [],
    remoteIconCache: true,
    emoji: '🖱️',
  },
  vscode: {
    bundleIds: ['com.microsoft.VSCode', 'com.microsoft.VSCodeInsiders'],
    appNames: ['Visual Studio Code', 'Code', 'Visual Studio Code - Insiders'],
    aliases: ['vs-code', 'code'],
    officialIconPages: ['https://code.visualstudio.com/brand'],
    officialIconUrls: ['https://code.visualstudio.com/assets/apple-touch-icon.png'],
    remoteIconCache: true,
    emoji: '📝',
  },
  claude: {
    bundleIds: ['com.anthropic.claude', 'com.anthropic.claudefordesktop'],
    appNames: ['Claude'],
    aliases: ['claude-code', 'anthropic'],
    officialIconPages: ['https://claude.ai/', 'https://www.anthropic.com/'],
    officialIconUrls: ['https://claude.ai/favicon.ico'],
    remoteIconCache: true,
    emoji: '🤖',
  },
  obsidian: {
    bundleIds: ['md.obsidian'],
    appNames: ['Obsidian'],
    officialIconPages: ['https://obsidian.md/'],
    officialIconUrls: [],
    remoteIconCache: true,
    emoji: '🧠',
  },
  docker: {
    bundleIds: ['com.docker.docker'],
    appNames: ['Docker', 'Docker Desktop'],
    officialIconPages: ['https://www.docker.com/products/docker-desktop/'],
    officialIconUrls: [],
    remoteIconCache: true,
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
    emoji: '📋',
  },
  hermes: {
    bundleIds: [],
    appNames: ['Hermes'],
    officialIconPages: [],
    officialIconUrls: [],
    remoteIconCache: false,
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
    emoji: '🌐',
  },
  github: {
    bundleIds: ['com.github.github', 'com.github.GitHubClient'],
    appNames: ['GitHub', 'GitHub Desktop'],
    officialIconPages: ['https://github.com/'],
    officialIconUrls: [],
    remoteIconCache: true,
    emoji: '🐙',
  },
  notion: {
    bundleIds: ['notion.id'],
    appNames: ['Notion'],
    officialIconPages: ['https://www.notion.com/'],
    officialIconUrls: [],
    remoteIconCache: true,
    emoji: '📓',
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
