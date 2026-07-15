// Tests for the R6 real-icon logic (brand-map + icon-extractor).
// Focus on the pure/sync resolution chain — spawn-based extraction is exercised
// lightly since it depends on which apps are installed on the host.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveBrandSpec, emojiForBrand, BRAND_APP_MAP, normalizeBrandKey, resolveBrandByFingerprint, extractHostname } from '../src/icon/brand-map.mjs';
import { resolveIconRef, getIconForBrand } from '../src/icon/icon-extractor.mjs';

test('resolveBrandSpec resolves known brands and raw bundle ids', () => {
  assert.ok(resolveBrandSpec('cursor'), 'cursor is a known brand');
  assert.equal(resolveBrandSpec('Cursor')?.appNames.includes('Cursor'), true, 'case-insensitive');
  assert.equal(normalizeBrandKey('code'), 'vscode');
  assert.equal(normalizeBrandKey('claude-code'), 'claude');
  // A dotted string is treated as an explicit bundle id
  const spec = resolveBrandSpec('com.example.MyApp');
  assert.deepEqual(spec?.bundleIds, ['com.example.MyApp']);
  // Unknown, non-dotted value → null
  assert.equal(resolveBrandSpec('totally-unknown-brand'), null);
  assert.equal(resolveBrandSpec(''), null);
});

test('R0 编辑器品牌都有可追溯的官方图标来源或本机应用映射', () => {
  const brands = ['hermes', 'claude', 'cursor', 'vscode', 'codeium', 'windsurf', 'continue', 'tauri', 'trae', 'trae-cn', 'qoder', 'codex', 'vim', 'neovim', 'emacs', 'sublime', 'jetbrains', 'nova', 'zed', 'copilot', 'replit', 'glot'];
  for (const brand of brands) {
    const spec = BRAND_APP_MAP[brand];
    assert.ok(spec, `${brand} must be registered`);
    assert.ok((spec.appNames?.length || 0) + (spec.bundleIds?.length || 0) > 0 || spec.localIconBase, `${brand} must have an official local icon source`);
    for (const url of spec.officialIconUrls || []) assert.match(url, /^https:\/\//);
  }
});

test('emojiForBrand returns the mapped emoji', () => {
  assert.equal(emojiForBrand('hermes'), BRAND_APP_MAP.hermes.emoji);
  assert.equal(emojiForBrand('CLAUDE-CODE'), BRAND_APP_MAP.claude.emoji);
  assert.equal(emojiForBrand('nope'), undefined);
});

test('resolveIconRef honors explicit frontmatter icon overrides', () => {
  assert.deepEqual(resolveIconRef({ icon: 'emoji:🎯' }), { iconFallback: '🎯' });
  assert.deepEqual(resolveIconRef({ icon: 'url:https://x/icon.png' }), {
    iconUrl: 'https://x/icon.png',
  });
  assert.deepEqual(resolveIconRef({ icon: 'app:com.microsoft.VSCode' }), {
    iconUrl: '/api/icons/com.microsoft.VSCode?size=64',
  });
  // Bare glyph → fallback emoji
  assert.deepEqual(resolveIconRef({ icon: '🔥' }), { iconFallback: '🔥' });
});

test('resolveIconRef maps brand/source to the official icon endpoint', () => {
  const ref = resolveIconRef({ brand: 'cursor' }, 64);
  assert.equal(ref.iconUrl, '/api/icons/cursor?size=64');
  // Falls through to source when brand is absent/unmapped
  const bySource = resolveIconRef({ source: 'vs-code' }, 32);
  assert.equal(bySource.iconUrl, '/api/icons/vscode?size=32');

  // Unknown brand → empty（前端显示中性占位）
  assert.deepEqual(resolveIconRef({ brand: 'made-up' }), {});
  assert.deepEqual(resolveIconRef({}), {});
});

test('resolveIconRef clamps invalid sizes to 64', () => {
  const ref = resolveIconRef({ brand: 'cursor' }, 999);
  assert.equal(ref.iconUrl, '/api/icons/cursor?size=64');
});

test('getIconForBrand returns null for an unmapped brand', async () => {
  const result = await getIconForBrand('definitely-not-an-app-xyz', 64);
  assert.equal(result, null);
});


test('getIconForBrand downloads registered official remote icon and reuses local cache', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-icon-remote-'));
  const oldHome = process.env.SKILLHELPER_HOME;
  const oldRemote = process.env.SKILLHELPER_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.SKILLHELPER_HOME = root;
  delete process.env.SKILLHELPER_ICON_REMOTE;
  t.after(() => {
    if (oldHome === undefined) delete process.env.SKILLHELPER_HOME;
    else process.env.SKILLHELPER_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.SKILLHELPER_ICON_REMOTE;
    else process.env.SKILLHELPER_ICON_REMOTE = oldRemote;
    globalThis.fetch = oldFetch;
    fs.rmSync(root, { recursive: true, force: true });
    delete BRAND_APP_MAP['remote-test'];
  });

  BRAND_APP_MAP['remote-test'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/official-icon.png'],
    remoteIconCache: true,
    emoji: '🧪',
  };

  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  };

  const first = await getIconForBrand('remote-test', 64);
  assert.ok(first, 'first request should cache a remote icon');
  assert.equal(path.extname(first), '.png');
  assert.equal(fs.existsSync(first), true);
  assert.equal(fetchCount, 1);

  globalThis.fetch = async () => {
    throw new Error('cache should avoid second network request');
  };
  const second = await getIconForBrand('remote-test', 64);
  assert.equal(second, first);
  assert.equal(fetchCount, 1);
});

test('getIconForBrand rejects non-image remote responses and honors SKILLHELPER_ICON_REMOTE=0', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-icon-reject-'));
  const oldHome = process.env.SKILLHELPER_HOME;
  const oldRemote = process.env.SKILLHELPER_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.SKILLHELPER_HOME = root;
  t.after(() => {
    if (oldHome === undefined) delete process.env.SKILLHELPER_HOME;
    else process.env.SKILLHELPER_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.SKILLHELPER_ICON_REMOTE;
    else process.env.SKILLHELPER_ICON_REMOTE = oldRemote;
    globalThis.fetch = oldFetch;
    fs.rmSync(root, { recursive: true, force: true });
    delete BRAND_APP_MAP['remote-non-image'];
    delete BRAND_APP_MAP['remote-disabled'];
  });

  BRAND_APP_MAP['remote-non-image'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/not-image.txt'],
    remoteIconCache: true,
  };
  globalThis.fetch = async () => new Response('not an image', {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
  delete process.env.SKILLHELPER_ICON_REMOTE;
  assert.equal(await getIconForBrand('remote-non-image', 64), null);

  BRAND_APP_MAP['remote-disabled'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/icon.png'],
    remoteIconCache: true,
  };
  process.env.SKILLHELPER_ICON_REMOTE = '0';
  globalThis.fetch = async () => {
    throw new Error('disabled remote icon fetch should not call network');
  };
  assert.equal(await getIconForBrand('remote-disabled', 64), null);
});


test('getIconForBrand rejects non-HTTPS, oversized, and failed official remote downloads', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-icon-invalid-'));
  const oldHome = process.env.SKILLHELPER_HOME;
  const oldRemote = process.env.SKILLHELPER_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.SKILLHELPER_HOME = root;
  delete process.env.SKILLHELPER_ICON_REMOTE;
  t.after(() => {
    if (oldHome === undefined) delete process.env.SKILLHELPER_HOME;
    else process.env.SKILLHELPER_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.SKILLHELPER_ICON_REMOTE;
    else process.env.SKILLHELPER_ICON_REMOTE = oldRemote;
    globalThis.fetch = oldFetch;
    fs.rmSync(root, { recursive: true, force: true });
    delete BRAND_APP_MAP['remote-http'];
    delete BRAND_APP_MAP['remote-too-large'];
    delete BRAND_APP_MAP['remote-download-fail'];
  });

  BRAND_APP_MAP['remote-http'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['http://example.com/icon.png'],
    remoteIconCache: true,
  };
  globalThis.fetch = async () => {
    throw new Error('non-HTTPS URLs must be rejected before fetch');
  };
  assert.equal(await getIconForBrand('remote-http', 64), null);

  BRAND_APP_MAP['remote-too-large'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/huge.png'],
    remoteIconCache: true,
  };
  globalThis.fetch = async () => new Response(Buffer.alloc(1024 * 1024 + 1), {
    status: 200,
    headers: { 'content-type': 'image/png' },
  });
  assert.equal(await getIconForBrand('remote-too-large', 64), null);

  BRAND_APP_MAP['remote-download-fail'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/missing.png'],
    remoteIconCache: true,
  };
  globalThis.fetch = async () => new Response('not found', {
    status: 404,
    headers: { 'content-type': 'image/png' },
  });
  assert.equal(await getIconForBrand('remote-download-fail', 64), null);
});

// ─────────── v0.4 provider fingerprint 测试 ───────────

test('extractHostname: 从 URL 或裸 hostname 提取小写主机名', () => {
  assert.equal(extractHostname('https://claude.ai/foo'), 'claude.ai');
  assert.equal(extractHostname('https://www.cursor.com/'), 'www.cursor.com');
  assert.equal(extractHostname('claude.ai'), 'claude.ai');
  assert.equal(extractHostname('HTTPS://GitHub.com/x'), 'github.com');
  assert.equal(extractHostname(''), null);
  assert.equal(extractHostname(null), null);
});

test('resolveBrandByFingerprint: hostname suffix 精确命中', () => {
  assert.equal(resolveBrandByFingerprint('https://claude.ai/'), 'claude');
  assert.equal(resolveBrandByFingerprint('https://cursor.com/'), 'cursor');
  assert.equal(resolveBrandByFingerprint('https://github.com/org/repo'), 'github');
  assert.equal(resolveBrandByFingerprint('https://www.docker.com/products'), 'docker');
});

test('resolveBrandByFingerprint: 子域命中（多级 suffix 匹配）', () => {
  assert.equal(resolveBrandByFingerprint('https://api.anthropic.com/'), 'claude');
  assert.equal(resolveBrandByFingerprint('https://docs.cursor.com/'), 'cursor');
  assert.equal(resolveBrandByFingerprint('https://raw.githubusercontent.com/'), 'github');
  assert.equal(resolveBrandByFingerprint('https://blog.notion.so/'), 'notion');
});

test('resolveBrandByFingerprint: 无匹配返回 null（调用方回退 custom）', () => {
  assert.equal(resolveBrandByFingerprint('https://example.com/'), null);
  assert.equal(resolveBrandByFingerprint('https://my-proxy.example.org/'), null);
  assert.equal(resolveBrandByFingerprint(''), null);
});

test('resolveBrandByFingerprint: 用户 overrides 优先于内置 fingerprints', () => {
  // overrides 精确匹配
  assert.equal(resolveBrandByFingerprint('https://my-proxy.local/', {
    'my-proxy.local': 'claude',
  }), 'claude');
  // overrides suffix 匹配（自定义反代域名）
  assert.equal(resolveBrandByFingerprint('https://api.my-proxy.local/', {
    'my-proxy.local': 'cursor',
  }), 'cursor');
  // overrides 覆盖内置：把 anthropic.com 重定向到其他品牌
  assert.equal(resolveBrandByFingerprint('https://anthropic.com/', {
    'anthropic.com': 'codex',
  }), 'codex');
});

test('resolveBrandByFingerprint: 裸 hostname 也能匹配', () => {
  assert.equal(resolveBrandByFingerprint('claude.ai'), 'claude');
  assert.equal(resolveBrandByFingerprint('obsidian.md'), 'obsidian');
});

test('BRAND_APP_MAP: 已加 fingerprints 的品牌字段结构正确', () => {
  // 确认阶段二给 9 个品牌加的 fingerprints 字段存在且为数组
  const withFp = Object.entries(BRAND_APP_MAP).filter(([, spec]) => Array.isArray(spec.fingerprints) && spec.fingerprints.length > 0);
  assert.ok(withFp.length >= 9, `至少 9 个品牌有 fingerprints，实际 ${withFp.length}`);
  for (const [, spec] of withFp) {
    for (const fp of spec.fingerprints) {
      assert.equal(typeof fp, 'string');
      assert.ok(fp.length > 0);
    }
  }
});

test('BRAND_APP_MAP.hermes: 远程 URL 已禁用，依赖本地烘焙的 official icon', () => {
  const hermes = BRAND_APP_MAP.hermes;
  assert.ok(hermes);
  // 官方 icon 改用用户提供的本地烘焙图，禁用远程回退以避免命中营销 banner。
  assert.deepEqual(hermes.officialIconUrls, []);
  assert.equal(hermes.remoteIconCache, false);
  assert.equal(hermes.localIconBase, 'icons/hermes');
  assert.ok(hermes.fingerprints.includes('hermes-agent.nousresearch.com'));
});

test('getIconForBrand: 本地兜底优先于远程下载', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-icon-local-'));
  // 在临时目录里复刻 web/public/icons/hermes-{size}.png 的结构
  const fakeWebPublic = path.join(root, 'packages', 'web', 'public');
  const iconsDir = path.join(fakeWebPublic, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  // 用 32 / 128 两个尺寸，验证 size=64 时会回退到 128
  fs.writeFileSync(path.join(iconsDir, 'hermes-32.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(path.join(iconsDir, 'hermes-128.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x99]));

  const oldCwd = process.cwd();
  const oldHome = process.env.SKILLHELPER_HOME;
  process.chdir(root);
  process.env.SKILLHELPER_HOME = root;
  t.after(() => {
    process.chdir(oldCwd);
    if (oldHome === undefined) delete process.env.SKILLHELPER_HOME;
    else process.env.SKILLHELPER_HOME = oldHome;
    fs.rmSync(root, { recursive: true, force: true });
  });

  // 不允许 fetch —— 如果走了远程路径会抛错
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('local fallback should not call network');
  };
  t.after(() => { globalThis.fetch = oldFetch; });

  const p32 = await getIconForBrand('hermes', 32);
  assert.ok(p32?.endsWith('hermes-32.png'));

  // 请求 64，文件不存在 → 应回退到 128（largest fallback first）
  const p64 = await getIconForBrand('hermes', 64);
  assert.ok(p64?.endsWith('hermes-128.png'), `期望回退到 hermes-128，实际 ${p64}`);
});
