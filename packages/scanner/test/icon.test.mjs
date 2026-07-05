// Tests for the R6 real-icon logic (brand-map + icon-extractor).
// Focus on the pure/sync resolution chain — spawn-based extraction is exercised
// lightly since it depends on which apps are installed on the host.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveBrandSpec, emojiForBrand, BRAND_APP_MAP, normalizeBrandKey } from '../src/icon/brand-map.mjs';
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-icon-remote-'));
  const oldHome = process.env.HUHAA_HOME;
  const oldRemote = process.env.HUHAA_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.HUHAA_HOME = root;
  delete process.env.HUHAA_ICON_REMOTE;
  t.after(() => {
    if (oldHome === undefined) delete process.env.HUHAA_HOME;
    else process.env.HUHAA_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.HUHAA_ICON_REMOTE;
    else process.env.HUHAA_ICON_REMOTE = oldRemote;
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

test('getIconForBrand rejects non-image remote responses and honors HUHAA_ICON_REMOTE=0', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-icon-reject-'));
  const oldHome = process.env.HUHAA_HOME;
  const oldRemote = process.env.HUHAA_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.HUHAA_HOME = root;
  t.after(() => {
    if (oldHome === undefined) delete process.env.HUHAA_HOME;
    else process.env.HUHAA_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.HUHAA_ICON_REMOTE;
    else process.env.HUHAA_ICON_REMOTE = oldRemote;
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
  delete process.env.HUHAA_ICON_REMOTE;
  assert.equal(await getIconForBrand('remote-non-image', 64), null);

  BRAND_APP_MAP['remote-disabled'] = {
    bundleIds: [],
    appNames: [],
    officialIconUrls: ['https://example.com/icon.png'],
    remoteIconCache: true,
  };
  process.env.HUHAA_ICON_REMOTE = '0';
  globalThis.fetch = async () => {
    throw new Error('disabled remote icon fetch should not call network');
  };
  assert.equal(await getIconForBrand('remote-disabled', 64), null);
});


test('getIconForBrand rejects non-HTTPS, oversized, and failed official remote downloads', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-icon-invalid-'));
  const oldHome = process.env.HUHAA_HOME;
  const oldRemote = process.env.HUHAA_ICON_REMOTE;
  const oldFetch = globalThis.fetch;
  process.env.HUHAA_HOME = root;
  delete process.env.HUHAA_ICON_REMOTE;
  t.after(() => {
    if (oldHome === undefined) delete process.env.HUHAA_HOME;
    else process.env.HUHAA_HOME = oldHome;
    if (oldRemote === undefined) delete process.env.HUHAA_ICON_REMOTE;
    else process.env.HUHAA_ICON_REMOTE = oldRemote;
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
