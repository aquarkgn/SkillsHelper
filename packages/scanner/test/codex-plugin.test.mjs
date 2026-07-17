import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanCodexPlugins } from '../src/adapters/codex-plugin.mjs';

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-codex-plugin-'));
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function manifestPath(root, version = '0.1.0') {
  return path.join(root, 'openai-bundled', 'sites', version, '.codex-plugin', 'plugin.json');
}

function sitesManifest(version = '0.1.0') {
  return JSON.stringify({
    name: 'sites',
    version,
    description: 'Build and deploy websites with Sites.',
    author: { name: 'OpenAI' },
    homepage: 'https://openai.com/',
    keywords: ['build', 'deploy', 'sites', 'website'],
    skills: './skills/',
    mcpServers: './.mcp.json',
    apps: './.app.json',
    interface: {
      displayName: 'Sites',
      shortDescription: 'Build and deploy websites with Sites',
      longDescription: 'Build, save, deploy, and inspect websites with Sites.',
      developerName: 'OpenAI',
      category: 'Productivity',
      capabilities: ['Interactive', 'Write'],
      websiteURL: 'https://openai.com/',
      defaultPrompt: ['Build a new-hire portal for my company'],
    },
  });
}

test('scanCodexPlugins parses Sites capabilities without exposing MCP configuration', async (t) => {
  const root = makeRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = manifestPath(root);
  const pluginDir = path.dirname(path.dirname(manifest));
  write(manifest, sitesManifest());
  write(path.join(pluginDir, 'skills', 'sites-building', 'SKILL.md'), '---\nname: sites-building\ndescription: Build sites\n---\n');
  write(path.join(pluginDir, '.mcp.json'), JSON.stringify({ env: { API_TOKEN: 'secret-value-must-not-leak' } }));

  const { items } = await scanCodexPlugins({ roots: [root] });
  assert.equal(items.length, 1);
  const item = items[0];
  assert.equal(item.kind, 'plugin');
  assert.equal(item.source, 'codex-plugin');
  assert.equal(item.editor, 'Codex');
  assert.equal(item.name, 'sites');
  assert.equal(item.title, 'Sites');
  assert.equal(item.plugin.manifestPath, manifest);
  assert.equal(item.plugin.author, 'OpenAI');
  assert.equal(item.plugin.category, 'Productivity');
  assert.deepEqual(item.plugin.capabilities, [
    { kind: 'skill', label: 'skills', count: 1 },
    { kind: 'mcp', label: 'mcpServers', count: undefined },
    { kind: 'app', label: 'apps', count: undefined },
    { kind: 'interactive', label: 'Interactive' },
    { kind: 'write', label: 'Write' },
  ]);
  assert.match(item.raw, /Build, save, deploy/);
  assert.doesNotMatch(item.raw, /secret-value-must-not-leak/);
  assert.doesNotMatch(JSON.stringify(item), /secret-value-must-not-leak/);
});

test('scanCodexPlugins keeps the highest version of one cached plugin', async (t) => {
  const root = makeRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(manifestPath(root, '0.1.9'), sitesManifest('0.1.9'));
  write(manifestPath(root, '0.2.0'), sitesManifest('0.2.0'));

  const { items } = await scanCodexPlugins({ roots: [root] });
  assert.equal(items.length, 1);
  assert.equal(items[0].plugin.version, '0.2.0');
});

test('scanCodexPlugins keeps malformed manifests visible as parse errors', async (t) => {
  const root = makeRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(manifestPath(root), '{ this is not json');

  const { items } = await scanCodexPlugins({ roots: [root] });
  assert.equal(items.length, 1);
  assert.match(items[0].parseError, /invalid plugin\.json/);
  assert.equal(items[0].plugin.manifestPath, manifestPath(root));
});

test('scanCodexPlugins reports unavailable roots without throwing', async () => {
  const { items, stats } = await scanCodexPlugins({ roots: ['/definitely/not/a/codex/plugin/root'] });
  assert.deepEqual(items, []);
  assert.equal(stats.available, false);
});
