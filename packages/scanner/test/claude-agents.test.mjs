import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanClaudeAgents } from '../src/adapters/claude-agents.mjs';

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

test('scanClaudeAgents 解析 agents/*.md 的 frontmatter', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-agents-'));
  write(
    path.join(root, 'agents', 'reviewer.md'),
    `---
name: code-reviewer
description: Reviews code for security issues.
tools:
  - Read
  - Grep
model: claude-sonnet
---

You are a careful code reviewer.
`,
  );
  write(
    path.join(root, 'agents', 'researcher.md'),
    `---
name: researcher
description: Long-running investigations.
---

You investigate topics in depth.
`,
  );

  const result = await scanClaudeAgents({ roots: [root] });
  assert.equal(result.items.length, 2);
  const byName = Object.fromEntries(result.items.map((i) => [i.name, i]));
  assert.equal(byName['code-reviewer']?.brand, 'claude');
  assert.equal(byName['code-reviewer']?.editorBrand, 'claude');
  assert.equal(byName['code-reviewer']?.kind, 'skill');
  assert.equal(byName['code-reviewer']?.description, 'Reviews code for security issues.');
  assert.ok(JSON.stringify(byName['code-reviewer'].raw).includes('code-reviewer'));
  assert.equal(byName.researcher?.description, 'Long-running investigations.');
});

test('scanClaudeAgents 忽略非 .md 文件', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-agents-md-'));
  write(
    path.join(root, 'agents', 'README.txt'),
    `---
name: notes
---
not an agent
`,
  );
  const result = await scanClaudeAgents({ roots: [root] });
  assert.equal(result.items.length, 0);
});

test('scanClaudeAgents 在 frontmatter 未闭合时把整个文件当作 body', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-claude-agents-unclosed-'));
  write(
    path.join(root, 'agents', 'incomplete.md'),
    `---
name: incomplete
description: still readable as a body
(no closing fence)
`,
  );
  const result = await scanClaudeAgents({ roots: [root] });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].name, 'incomplete');
  assert.ok(result.items[0].raw.includes('incomplete'));
});