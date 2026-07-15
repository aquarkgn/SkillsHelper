import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { startServer } from '../src/index.mjs';

// 动态读取根 package.json 的版本号，避免每次升版本导致断言失效
const PKG_VERSION = JSON.parse(
  fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
).version;

function makeTempHome() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-server-test-'));
  const home = path.join(root, 'home');
  fs.mkdirSync(home, { recursive: true });
  process.env.SKILLHELPER_HOME = home;
  return { root, home };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

async function bootFixtureServer(t, { withCodexPlugin = false } = {}) {
  const { root, home } = makeTempHome();
  // v4.0 tier 扫描器使用 ~ 展开后的硬编码路径（~/.hermes/skills 等），
  // 不再读取 sources.yaml 的 hermes.roots。把 HOME 指向临时目录，让 tier1
  // 扫描器从 <home>/.hermes/skills/ 下找到 fixture skill。
  const oldHome = process.env.HOME;
  process.env.HOME = home;
  t.after(() => { process.env.HOME = oldHome; });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  write(path.join(home, '.hermes', 'skills', 'quote-skill', 'SKILL.md'), `---
name: quote's skill
description: Skill used by API tests
---
# API test skill
`);
  if (withCodexPlugin) {
    const pluginDir = path.join(home, '.codex', 'plugins', 'cache', 'openai-bundled', 'sites', '0.1.0');
    write(path.join(pluginDir, '.codex-plugin', 'plugin.json'), JSON.stringify({
      name: 'sites',
      version: '0.1.0',
      description: 'Build and deploy websites with Sites.',
      mcpServers: './.mcp.json',
      interface: {
        displayName: 'Sites',
        logo: './assets/logo.svg',
        capabilities: ['Interactive', 'Write'],
      },
    }));
    write(path.join(pluginDir, 'assets', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#0ea5e9"/></svg>');
    write(path.join(pluginDir, '.mcp.json'), JSON.stringify({ env: { API_TOKEN: 'server-test-secret' } }));

    const badLogoDir = path.join(home, '.codex', 'plugins', 'cache', 'local', 'bad-logo', '1.0.0');
    write(path.join(badLogoDir, '.codex-plugin', 'plugin.json'), JSON.stringify({
      name: 'bad-logo',
      version: '1.0.0',
      description: 'Plugin with a non-image logo.',
      interface: {
        displayName: 'Bad Logo',
        logo: './assets/logo.txt',
      },
    }));
    write(path.join(badLogoDir, 'assets', 'logo.txt'), 'not an image');
  }
  // sources.yaml 必须存在（loadConfig 返回 null 时 scan() 直接返回 []）。
  // tier 扫描器不消费其 roots，但需要其 truthy 以继续扫描；保留 limits。
  write(path.join(home, 'sources.yaml'), `limits:
  maxFiles: 100
  maxFileBytes: 1048576
`);

  const server = await startServer({ port: 0 });
  t.after(async () => { await server.app.close(); });
  return server;
}

test('server exposes health, list, detail, stats, and reload state without raw in list', async (t) => {
  const { app } = await bootFixtureServer(t);

  const health = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(health.statusCode, 200);
  assert.deepEqual(JSON.parse(health.body), {
    ok: true,
    port: 0,
    items: 1,
    version: PKG_VERSION,
    phase: 'P6',
  });

  const list = await app.inject({ method: 'GET', url: '/api/skills' });
  assert.equal(list.statusCode, 200);
  const items = JSON.parse(list.body);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "quote's skill");
  assert.equal(items[0].editorKey, 'Hermes', '列表接口应返回规范来源筛选键');
  assert.equal(items[0].raw, undefined, 'list endpoint must not expose raw content');
  assert.equal(items[0].iconUrl, '/api/icons/hermes?size=64');
  assert.equal(items[0].iconFallback, undefined, '品牌无官方图标时不再注入 emoji 伪装兜底');

  const detail = await app.inject({ method: 'GET', url: `/api/skills/${items[0].id}` });
  assert.equal(detail.statusCode, 200);
  assert.match(JSON.parse(detail.body).raw, /API test skill/);

  const stats = await app.inject({ method: 'GET', url: '/api/stats' });
  assert.equal(stats.statusCode, 200);
  // v4.0 tier 扫描器把 source 标为 'tier1-editor'，品牌（hermes）记录在 byBrand。
  assert.equal(JSON.parse(stats.body).byBrand.hermes, 1);

  const reloadState = await app.inject({ method: 'GET', url: '/api/reload-state' });
  assert.equal(reloadState.statusCode, 200);
  assert.equal(JSON.parse(reloadState.body).items, 1);
});

test('server exposes safe Codex plugin metadata without leaking MCP configuration', async (t) => {
  const { app } = await bootFixtureServer(t, { withCodexPlugin: true });
  const list = JSON.parse((await app.inject({ method: 'GET', url: '/api/skills' })).body);
  const plugin = list.find((item) => item.source === 'codex-plugin' && item.name === 'sites');

  assert.equal(plugin.name, 'sites');
  assert.equal(plugin.kind, 'plugin');
  assert.equal(plugin.editorBrand, 'codex');
  assert.equal(plugin.raw, undefined);
  assert.match(plugin.iconUrl, /^\/api\/plugin-icons\//);
  assert.deepEqual(plugin.plugin.capabilities.map((capability) => capability.kind), ['mcp', 'interactive', 'write']);
  assert.doesNotMatch(JSON.stringify(plugin), /server-test-secret/);

  const detail = await app.inject({ method: 'GET', url: `/api/skills/${plugin.id}` });
  assert.equal(detail.statusCode, 200);
  const detailBody = JSON.parse(detail.body);
  assert.equal(detailBody.iconUrl, plugin.iconUrl);
  assert.doesNotMatch(JSON.stringify(detailBody), /server-test-secret/);

  const icon = await app.inject({ method: 'GET', url: plugin.iconUrl });
  assert.equal(icon.statusCode, 200);
  assert.equal(icon.headers['content-type'], 'image/svg+xml');
  assert.match(icon.body, /<svg\b/);

  const missingIcon = await app.inject({ method: 'GET', url: '/api/plugin-icons/no-such-plugin' });
  assert.equal(missingIcon.statusCode, 404);

  const traversalIcon = await app.inject({ method: 'GET', url: '/api/plugin-icons/..%2F..%2Fpackage.json' });
  assert.equal(traversalIcon.statusCode, 404);

  const badLogo = list.find((item) => item.name === 'bad-logo');
  const badLogoIcon = await app.inject({ method: 'GET', url: `/api/plugin-icons/${badLogo.id}` });
  assert.equal(badLogoIcon.statusCode, 404);
});

test('server copies invocation prompt through pbcopy using a whitelisted item id', async (t) => {
  const { root } = makeTempHome();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  const copiedFile = path.join(root, 'copied.txt');
  fs.mkdirSync(bin, { recursive: true });
  // 服务器的 pbcopy() 按平台选择二进制：darwin→pbcopy / linux→xclip / win32→clip。
  // 假二进制必须与目标平台同名，否则 spawn ENOENT。
  const clipBin = process.platform === 'darwin' ? 'pbcopy'
    : process.platform === 'win32' ? 'clip'
    : 'xclip';
  write(path.join(bin, clipBin), `#!/usr/bin/env node\nimport fs from 'node:fs';\nlet s='';\nprocess.stdin.on('data', d => s += d);\nprocess.stdin.on('end', () => fs.writeFileSync(${JSON.stringify(copiedFile)}, s));\n`);
  fs.chmodSync(path.join(bin, clipBin), 0o755);
  const oldPath = process.env.PATH;
  process.env.PATH = `${bin}:${oldPath || ''}`;
  t.after(() => { process.env.PATH = oldPath; });

  const { app } = await bootFixtureServer(t);
  const items = JSON.parse((await app.inject({ method: 'GET', url: '/api/skills' })).body);
  const res = await app.inject({
    method: 'POST',
    url: '/api/copy',
    payload: { id: items[0].id, what: 'prompt' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ok, true);
  const copied = fs.readFileSync(copiedFile, 'utf8');
  assert.equal(copied, "Use Hermes skill quote's skill: skill_view(name='quote\\'s skill')");
});

test('server rejects unknown ids and invalid copy/open inputs before any OS side effect', async (t) => {
  const { app } = await bootFixtureServer(t);
  const items = JSON.parse((await app.inject({ method: 'GET', url: '/api/skills' })).body);
  const id = items[0].id;

  const missing = await app.inject({ method: 'GET', url: '/api/skills/nope' });
  assert.equal(missing.statusCode, 404);

  const badCopy = await app.inject({
    method: 'POST',
    url: '/api/copy',
    payload: { id, what: '../../etc/passwd' },
  });
  assert.equal(badCopy.statusCode, 400);
  assert.match(badCopy.body, /invalid 'what'/);

  const missingOpen = await app.inject({
    method: 'POST',
    url: '/api/open',
    payload: { id: 'nope', with: 'finder' },
  });
  assert.equal(missingOpen.statusCode, 404);
});

test('server asset route rejects path traversal', async (t) => {
  const { app } = await bootFixtureServer(t);
  const res = await app.inject({ method: 'GET', url: '/assets/..%2F..%2Fpackage.json' });
  assert.equal(res.statusCode, 404);
});

test('server serves favicon files from root paths before SPA fallback', async (t) => {
  const { app } = await bootFixtureServer(t);

  const svg = await app.inject({ method: 'GET', url: '/favicon.svg' });
  assert.equal(svg.statusCode, 200);
  assert.equal(svg.headers['content-type'], 'image/svg+xml');
  assert.match(svg.body, /<svg\b/);

  const png = await app.inject({ method: 'GET', url: '/favicon-32x32.png' });
  assert.equal(png.statusCode, 200);
  assert.equal(png.headers['content-type'], 'image/png');
  assert.deepEqual([...png.rawPayload.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ico = await app.inject({ method: 'GET', url: '/favicon.ico' });
  assert.equal(ico.statusCode, 200);
  assert.equal(ico.headers['content-type'], 'image/x-icon');
  assert.equal(ico.rawPayload.readUInt16LE(0), 0);
  assert.equal(ico.rawPayload.readUInt16LE(2), 1);
});

test('server serves project brand icons and bundled hermes icons from root paths (no SPA fallback)', async (t) => {
  const { app } = await bootFixtureServer(t);

  // Topbar 引用的项目 brand icon
  const brandIcon = await app.inject({ method: 'GET', url: '/brand-icon.png' });
  assert.equal(brandIcon.statusCode, 200, 'brand-icon.png must be served from root, not SPA fallback');
  assert.equal(brandIcon.headers['content-type'], 'image/png');
  assert.deepEqual([...brandIcon.rawPayload.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const brandLogo = await app.inject({ method: 'GET', url: '/brand-logo.png' });
  assert.equal(brandLogo.statusCode, 200, 'brand-logo.png must be served from root');
  assert.equal(brandLogo.headers['content-type'], 'image/png');

  // bundled hermes 离线兜底图标（web/public/icons/）
  const hermes32 = await app.inject({ method: 'GET', url: '/icons/hermes-32.png' });
  assert.equal(hermes32.statusCode, 200, 'icons/hermes-32.png must be served from root');
  assert.equal(hermes32.headers['content-type'], 'image/png');
  assert.equal(hermes32.rawPayload.length > 0, true);
});

test('server serves SkillHelper manifest with app icons', async (t) => {
  const { app } = await bootFixtureServer(t);
  const res = await app.inject({ method: 'GET', url: '/site.webmanifest' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/manifest+json; charset=utf-8');
  const manifest = JSON.parse(res.body);
  assert.equal(manifest.name, '呼哈哈-技能助手');
  assert.equal(manifest.short_name, '呼哈哈');
  assert.match(manifest.description, /呼哈哈-技能助手/);
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.src === '/favicon-192x192.png'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.src === '/favicon-512x512.png'));
});
