import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { startServer } from '../src/index.mjs';

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
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const skillRoot = path.join(root, 'skills');
  write(path.join(skillRoot, 'ops', 'quote-skill', 'SKILL.md'), `---
name: quote's skill
description: Skill used by API tests
---
# API test skill
`);
  write(path.join(home, 'sources.yaml'), `sources:
  hermes:
    enabled: true
    roots:
      - ${JSON.stringify(skillRoot)}
limits:
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
    version: '0.3.2',
    phase: 'P6',
  });

  const list = await app.inject({ method: 'GET', url: '/api/skills' });
  assert.equal(list.statusCode, 200);
  const items = JSON.parse(list.body);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "quote's skill");
  assert.equal(items[0].raw, undefined, 'list endpoint must not expose raw content');

  const detail = await app.inject({ method: 'GET', url: `/api/skills/${items[0].id}` });
  assert.equal(detail.statusCode, 200);
  assert.match(JSON.parse(detail.body).raw, /API test skill/);

  const stats = await app.inject({ method: 'GET', url: '/api/stats' });
  assert.equal(stats.statusCode, 200);
  assert.equal(JSON.parse(stats.body).bySource.hermes, 1);

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
  write(path.join(bin, 'pbcopy'), `#!/usr/bin/env node\nimport fs from 'node:fs';\nlet s='';\nprocess.stdin.on('data', d => s += d);\nprocess.stdin.on('end', () => fs.writeFileSync(${JSON.stringify(copiedFile)}, s));\n`);
  fs.chmodSync(path.join(bin, 'pbcopy'), 0o755);
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
