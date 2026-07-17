import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanClaudePlugins } from '../src/adapters/claude-plugin.mjs';

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

test('scanClaudePlugins 解析 <plugin>/.claude-plugin/plugin.json', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-plugin-'));
  write(
    path.join(root, 'enterprise-devops', '.claude-plugin', 'plugin.json'),
    JSON.stringify({
      name: 'enterprise-devops',
      version: '2.3.1',
      description: 'Enterprise CI/CD automation.',
      author: { name: 'DevOps Team' },
      keywords: ['devops', 'ci-cd'],
    }),
  );
  write(
    path.join(root, 'docs-helper', '.claude-plugin', 'plugin.json'),
    JSON.stringify({
      name: 'docs-helper',
      description: 'Documentation writer.',
    }),
  );

  const result = await scanClaudePlugins({ roots: [root] });
  assert.equal(result.items.length, 2);
  const byName = Object.fromEntries(result.items.map((i) => [i.name, i]));
  assert.equal(byName['enterprise-devops']?.kind, 'plugin');
  assert.equal(byName['enterprise-devops']?.brand, 'claude');
  assert.equal(byName['enterprise-devops']?.editorBrand, 'claude');
  assert.equal(byName['enterprise-devops']?.description, 'Enterprise CI/CD automation.');
  assert.deepEqual(byName['enterprise-devops']?.tags, ['devops', 'ci-cd']);
  assert.equal(byName['docs-helper']?.description, 'Documentation writer.');
});

test('scanClaudePlugins manifest 解析失败时附 parseError 但仍返回 item', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-plugin-broken-'));
  write(path.join(root, 'broken', '.claude-plugin', 'plugin.json'), '{ "name": "broken" ');

  const result = await scanClaudePlugins({ roots: [root] });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].name, 'broken');
  assert.ok(result.items[0].parseError);
});

test('scanClaudePlugins 收集 components 字段（agents/mcp/skills 等）', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-plugin-components-'));
  write(
    path.join(root, 'full', '.claude-plugin', 'plugin.json'),
    JSON.stringify({
      name: 'full',
      agents: ['./agents'],
      skills: ['./skills'],
      mcpServers: { foo: { command: 'foo' } },
    }),
  );
  const result = await scanClaudePlugins({ roots: [root] });
  assert.equal(result.items.length, 1);
  assert.ok(result.items[0].raw.includes('agents'));
  assert.ok(result.items[0].raw.includes('mcp'));
});