import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanMcpConfigs } from '../src/adapters/mcp-config.mjs';

function writeConfig(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

test('scanMcpConfigs infers brand from config path and attaches to MCP server items', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-mcp-brand-'));
  const codexFile = path.join(root, '.codex', 'config.toml');
  writeConfig(codexFile, `[mcp_servers.github]\ncommand = "gh-mcp"\nargs = ["serve"]\n`);
  const claudeFile = path.join(root, '.claude', 'mcp.json');
  writeConfig(
    claudeFile,
    JSON.stringify({ mcpServers: { slack: { command: 'slack-mcp', env: { TOKEN: 'sk-secret-1234567890' } } } }),
  );

  const result = await scanMcpConfigs({ files: [codexFile, claudeFile] });
  const byName = Object.fromEntries(result.items.map((item) => [item.name, item]));
  assert.equal(byName.github?.brand, 'codex');
  assert.equal(byName.github?.editorBrand, 'codex');
  assert.equal(byName.slack?.brand, 'claude');
  assert.equal(byName.slack?.editorBrand, 'claude');
  // credentials 仍被 redact
  assert.ok(!JSON.stringify(byName.slack.raw).includes('sk-secret-1234567890'));
});

test('scanMcpConfigs leaves brand undefined for unknown paths', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-mcp-unknown-'));
  const misc = path.join(root, 'random', 'config.json');
  writeConfig(misc, JSON.stringify({ mcpServers: { foo: { command: 'foo' } } }));
  const result = await scanMcpConfigs({ files: [misc] });
  assert.equal(result.items[0]?.brand, undefined);
  assert.equal(result.items[0]?.editorBrand, undefined);
});