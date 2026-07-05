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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-server-test-'));
  const home = path.join(root, 'home');
  fs.mkdirSync(home, { recursive: true });
  process.env.HUHAA_HOME = home;
  return { root, home };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

async function bootFixtureServer(t) {
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
  assert.equal(items[0].raw, undefined, 'list endpoint must not expose raw content');
  assert.equal(items[0].iconUrl, '/api/icons/hermes?size=64');
  assert.equal(items[0].iconFallback, '⚡');

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
