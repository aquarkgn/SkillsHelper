import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { scan, getWatchTargets, scanLegacy, loadConfig } from '../src/index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function makeTempHome() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-scanner-test-'));
  const home = path.join(root, 'home');
  fs.mkdirSync(home, { recursive: true });
  process.env.SKILLHELPER_HOME = home;
  return { root, home };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function groupBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

test('scan aggregates enabled sources and strips duplicate semantic skill exports', async (t) => {
  const { root, home } = makeTempHome();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const sources = path.join(home, 'sources.yaml');
  const hermesRoot = path.join(root, 'hermes-skills');
  const codexRoot = path.join(root, 'project-a');
  const cursorRoot = path.join(root, 'project-b');
  const directorySkillsRoot = path.join(root, 'custom-skills');
  const codexPluginsRoot = path.join(root, 'codex-plugins');

  write(path.join(hermesRoot, 'devops', 'deploy-helper', 'SKILL.md'), `---
name: deploy-helper
description: Deploy helper for Docker services
triggers:
  - deploy service
---
# Deploy helper
Use this when deploying Docker services.
`);
  write(path.join(hermesRoot, '.hidden-export', 'deploy-helper', 'SKILL.md'), `---
name: deploy-helper
description: Duplicate hidden export
---
# Duplicate hidden export
`);
  write(path.join(codexRoot, 'AGENTS.md'), '# Codex Instructions\\n\\nUse Node 20 and run tests.');
  write(path.join(cursorRoot, '.cursorrules'), 'Always keep UI concise.');
  write(path.join(directorySkillsRoot, 'auth-flow', 'SKILL.md'), `---
name: auth-flow
description: Custom auth flow implementation
---
# Auth Flow
`);
  write(path.join(codexPluginsRoot, 'openai-bundled', 'sites', '0.1.0', '.codex-plugin', 'plugin.json'), JSON.stringify({
    name: 'sites',
    version: '0.1.0',
    description: 'Build and deploy websites with Sites.',
    interface: { displayName: 'Sites', capabilities: ['Interactive', 'Write'] },
  }));

  write(sources, `sources:
  hermes:
    enabled: true
    roots:
      - ${JSON.stringify(hermesRoot)}
  codex:
    enabled: true
    roots:
      - ${JSON.stringify(codexRoot)}
  cursor:
    enabled: true
    roots:
      - ${JSON.stringify(cursorRoot)}
  directory-skill:
    enabled: true
    paths:
      - ${JSON.stringify(directorySkillsRoot)}
  codex-plugin:
    enabled: true
    roots:
      - ${JSON.stringify(codexPluginsRoot)}
limits:
  maxFiles: 100
  maxFileBytes: 1048576
`);

  const items = await scanLegacy(loadConfig(), { maxFiles: 100, maxFileBytes: 1048576 });
  const bySource = groupBy(items, it => it.source);

  assert.equal(bySource.hermes?.length, 1, 'semantic duplicate hermes skill should collapse to one item');
  assert.equal(bySource.codex?.length, 1);
  assert.equal(bySource.cursor?.length, 1);
  assert.equal(bySource.directory?.length, 1, 'directory-skill should return one item');
  assert.equal(bySource['codex-plugin']?.length, 1, 'codex plugin should be scanned');

  // Verify Tier 1 tool skills have tier='tier-1' (scanLegacy 把 'tool' 转成 'tier-1') and brand
  const hermesSkill = bySource.hermes[0];
  assert.equal(hermesSkill.tier, 'tier-1', 'hermes skill should have tier="tier-1"');
  assert.equal(hermesSkill.brand, 'hermes', 'hermes skill should have brand="hermes"');
  assert.equal(hermesSkill.name, 'deploy-helper');
  assert.equal(hermesSkill.editor, 'Hermes Agent');
  assert.equal(hermesSkill.category, 'devops');
  assert.deepEqual(hermesSkill.triggers, ['deploy service']);
  assert.ok(!hermesSkill.paths.abs.includes('/.hidden-export/'), 'visible export should outrank hidden duplicate');

  // Verify Tier 2 directory skills have tier='tier-2' (scanLegacy 把 'directory' 转成 'tier-2') and dirName
  const dirSkill = bySource.directory[0];
  assert.equal(dirSkill.tier, 'tier-2', 'directory-skill should have tier="tier-2"');
  assert.equal(dirSkill.dirName, 'auth-flow', 'directory-skill should have dirName="auth-flow"');
  assert.equal(dirSkill.source, 'directory', 'directory-skill should have source="directory"');
  assert.equal(dirSkill.name, 'auth-flow');

  const codexPlugin = bySource['codex-plugin'][0];
  assert.equal(codexPlugin.tier, 'tier-1');
  assert.equal(codexPlugin.editorBrand, 'codex');
  assert.equal(codexPlugin.kind, 'plugin');
  assert.equal(codexPlugin.plugin.manifestPath.endsWith('/.codex-plugin/plugin.json'), true);
});

test('getWatchTargets includes config file plus configured source files and globs', async (t) => {
  const { root, home } = makeTempHome();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const hermesRoot = path.join(root, 'skills');
  const directorySkillsRoot = path.join(root, 'custom-skills');
  const codexPluginsRoot = path.join(root, 'codex-plugins');
  fs.mkdirSync(hermesRoot, { recursive: true });
  fs.mkdirSync(directorySkillsRoot, { recursive: true });
  fs.mkdirSync(codexPluginsRoot, { recursive: true });

  write(path.join(home, 'sources.yaml'), `sources:
  hermes:
    enabled: true
    roots:
      - ${JSON.stringify(hermesRoot)}
  directory-skill:
    enabled: true
    paths:
      - ${JSON.stringify(directorySkillsRoot)}
  codex-plugin:
    enabled: true
    roots:
      - ${JSON.stringify(codexPluginsRoot)}
`);

  const targets = await getWatchTargets();
  assert.ok(targets.includes(path.join(home, 'sources.yaml')));
  assert.ok(targets.some(t => t.endsWith('/skills/**/SKILL.md')));
  assert.ok(targets.some(t => t.endsWith('/custom-skills/**/SKILL.md')));
  assert.ok(targets.some(t => t.endsWith('/codex-plugins/**/.codex-plugin/plugin.json')));
});

test('scan uses the Codex plugin cache by default for existing sources.yaml files', async (t) => {
  const { root, home } = makeTempHome();
  const oldHome = process.env.HOME;
  process.env.HOME = home;
  t.after(() => {
    process.env.HOME = oldHome;
    fs.rmSync(root, { recursive: true, force: true });
  });

  write(path.join(home, 'sources.yaml'), 'limits:\n  maxFiles: 100\n  maxFileBytes: 1048576\n');
  write(path.join(home, '.codex', 'plugins', 'cache', 'openai-bundled', 'sites', '0.1.0', '.codex-plugin', 'plugin.json'), JSON.stringify({
    name: 'sites',
    version: '0.1.0',
    description: 'Build and deploy websites with Sites.',
  }));

  const items = await scan();
  const plugin = items.find((item) => item.source === 'codex-plugin');
  assert.equal(plugin?.name, 'sites');
  assert.equal(plugin?.editorBrand, 'codex');
});

test('CLI scan writes machine-readable JSON to stdout and progress logs to stderr', (t) => {
  const { root, home } = makeTempHome();
  const userHome = path.join(root, 'user-home');
  fs.mkdirSync(userHome, { recursive: true });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  write(path.join(home, 'sources.yaml'), `limits:
  maxFiles: 100
  maxFileBytes: 1048576
`);

  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/skillhelper.mjs'), 'scan', '--json'], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      HOME: userHome,
      SKILLHELPER_HOME: home,
    },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /\[scan\]/, 'stdout should not contain progress logs');
  assert.match(result.stderr, /\[scan\]/, 'stderr should contain scan progress logs');

  const parsed = JSON.parse(result.stdout);
  assert.ok(Array.isArray(parsed), 'stdout should be a JSON array');
});
