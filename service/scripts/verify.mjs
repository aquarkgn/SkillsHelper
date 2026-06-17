#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-verify-'));
const oldHome = process.env.HUHAA_HOME;
process.env.HUHAA_HOME = path.join(tempRoot, 'home');

const testFiles = [
  'service/packages/scanner/test/scanner.test.mjs',
  'service/packages/server/test/server.test.mjs',
];

function run(name, args) {
  console.log(`\n[verify] $ ${name} ${args.join(' ')}`);
  const res = spawnSync(name, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) throw new Error(`${name} ${args.join(' ')} failed with exit ${res.status}`);
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

async function main() {
  try {
    run('npm', ['run', 'build:web']);
    run('node', ['--test', ...testFiles]);

    const skillRoot = path.join(tempRoot, 'skills');
    write(path.join(skillRoot, 'demo', 'verify-skill', 'SKILL.md'), `---
name: verify-skill
description: Verify smoke skill
triggers:
  - verify smoke
---
# Verify smoke skill
Use this item to prove the local server works.
`);
    write(path.join(process.env.HUHAA_HOME, 'sources.yaml'), `sources:
  hermes:
    enabled: true
    roots:
      - ${JSON.stringify(skillRoot)}
limits:
  maxFiles: 100
  maxFileBytes: 1048576
`);

    const { startServer } = await import('../packages/server/src/index.mjs');
    const { app } = await startServer({ port: 0 });
    const address = app.server.address();
    const port = address.port;
    const base = `http://127.0.0.1:${port}`;
    console.log(`\n[verify] server listening on ${base}`);

    try {
      const health = await fetchJson(`${base}/api/health`);
      assert.equal(health.ok, true);
      assert.equal(health.items, 1);
      assert.equal(health.version, '0.1.0');

      const skills = await fetchJson(`${base}/api/skills`);
      assert.equal(skills.length, 1);
      assert.equal(skills[0].name, 'verify-skill');
      assert.equal(skills[0].raw, undefined, '/api/skills must strip raw content');

      const detail = await fetchJson(`${base}/api/skills/${skills[0].id}`);
      assert.match(detail.raw, /Verify smoke skill/);

      const stats = await fetchJson(`${base}/api/stats`);
      assert.equal(stats.total, 1);
      assert.equal(stats.bySource.hermes, 1);

      const reload = await fetchJson(`${base}/api/reload`, { method: 'POST' });
      assert.equal(reload.ok, true);
      assert.equal(reload.items, 1);

      const index = await fetchText(`${base}/`);
      assert.match(index.body, /<div id="app"><\/div>/);
      const jsMatch = index.body.match(/\/assets\/[^"']+\.js/);
      const cssMatch = index.body.match(/\/assets\/[^"']+\.css/);
      assert.ok(jsMatch, 'index.html should reference built JS asset');
      assert.ok(cssMatch, 'index.html should reference built CSS asset');

      const js = await fetchText(`${base}${jsMatch[0]}`);
      assert.equal(js.contentType.split(';')[0], 'text/javascript');
      assert.ok(js.body.length > 1000);

      const css = await fetchText(`${base}${cssMatch[0]}`);
      assert.equal(css.contentType.split(';')[0], 'text/css');
      assert.ok(css.body.includes('toolbar-card'));

      console.log('\n[verify] PASS build + tests + HTTP/API/static smoke checks');
    } finally {
      await app.close();
    }
  } finally {
    if (oldHome == null) delete process.env.HUHAA_HOME;
    else process.env.HUHAA_HOME = oldHome;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  assert.equal(res.ok, true, `${url} returned ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function fetchText(url, init) {
  const res = await fetch(url, init);
  const body = await res.text();
  assert.equal(res.ok, true, `${url} returned ${res.status}: ${body.slice(0, 200)}`);
  return { body, contentType: res.headers.get('content-type') || '' };
}

main().catch(err => {
  console.error('\n[verify] FAIL');
  console.error(err && err.stack || err);
  process.exit(1);
});
