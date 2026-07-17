import test from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_REGISTRY, normalizeBrandKey, resolveIconRef, resolveSourceBrand } from '../src/icon/brand-registry.mjs';
import { getIconForBrand, isAllowedBundleId } from '../src/icon/icon-extractor.mjs';

test('R0 的 22 个来源品牌与已接入的 OpenClaw 均有唯一注册记录与 HTTPS 官方来源', () => {
  assert.equal(Object.keys(BRAND_REGISTRY).length, 23);
  const aliases = new Set();
  for (const entry of Object.values(BRAND_REGISTRY)) {
    assert.match(entry.sourceUrl, /^https:\/\//);
    for (const alias of [entry.id, ...entry.aliases]) {
      assert.equal(aliases.has(alias), false, `重复别名：${alias}`);
      aliases.add(alias);
    }
  }
});

test('别名归一化不会将 Codeium 误认为 Windsurf', () => {
  assert.equal(normalizeBrandKey('CODEIUM'), 'codeium');
  assert.equal(normalizeBrandKey('codeium-windsurf'), 'codeium');
  assert.equal(normalizeBrandKey('windsurf'), 'windsurf');
  assert.equal(normalizeBrandKey('made-up'), null);
});

test('来源归因遵守显式来源、编辑器、来源名、主机名的固定优先级', () => {
  assert.equal(resolveSourceBrand({ sourceBrand: 'codeium', editor: 'Windsurf' }), 'codeium');
  assert.equal(resolveSourceBrand({ editorBrand: 'claude-code', source: 'codex' }), 'claude');
  assert.equal(resolveSourceBrand({ source: 'vs-code' }), 'vscode');
  assert.equal(resolveSourceBrand({ hostname: 'api.anthropic.com' }), 'claude');
  assert.equal(resolveSourceBrand({ source: 'nothing' }), null);
});

test('IconRef 使用已固化的官方资产，待补齐与未知来源明确中性', () => {
  assert.deepEqual(resolveIconRef({ sourceBrand: 'hermes' }), {
    kind: 'asset', brandId: 'hermes', assetId: 'hermes-v1', src: '/icons/hermes-64.png',
  });
  assert.deepEqual(resolveIconRef({ sourceBrand: 'cursor' }), {
    kind: 'asset', brandId: 'cursor', assetId: 'cursor-macos-v1', src: '/brand-assets/cursor.png',
  });
  assert.deepEqual(resolveIconRef({ sourceBrand: 'openclaw' }), {
    kind: 'asset', brandId: 'openclaw', assetId: 'openclaw-web-v1', src: '/brand-assets/openclaw.svg',
  });
  assert.deepEqual(resolveIconRef({ sourceBrand: 'made-up' }), { kind: 'neutral', reason: 'unknown-brand' });
});

test('frontmatter 的 url、emoji 不参与品牌 IconRef，Bundle ID 仅允许白名单', async () => {
  assert.deepEqual(resolveIconRef({ icon: 'url:https://example.com/icon.png' }), { kind: 'neutral', reason: 'unknown-brand' });
  assert.equal(isAllowedBundleId('com.microsoft.VSCode'), true);
  assert.equal(isAllowedBundleId('com.example.untrusted'), false);
  assert.equal(await getIconForBrand('definitely-not-a-brand'), null);
});
