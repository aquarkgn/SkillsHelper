import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanTier2UserSkills } from '../src/adapters/tier2-user-skills.mjs';
import { scanTier3OtherSkills } from '../src/adapters/tier3-other-skills.mjs';
import { USER_TIER_2_CONFIG, OTHER_TIER_3_CONFIGS } from '../src/config/editor-tiers.mjs';
import { pathHashCache } from '../src/hash/path-hash.mjs';

function writeSkill(file, name) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---
name: ${name}
description: ${name} description
---
# ${name}
`);
}

test('Tier 2 用户技能写入 my-skills editor 并保留稳定 source', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-tier2-editor-'));
  const oldGlobalPath = USER_TIER_2_CONFIG.globalPath;

  t.after(() => {
    USER_TIER_2_CONFIG.globalPath = oldGlobalPath;
    pathHashCache.clear();
    fs.rmSync(root, { recursive: true, force: true });
  });

  USER_TIER_2_CONFIG.globalPath = path.join(root, 'skills');
  writeSkill(path.join(USER_TIER_2_CONFIG.globalPath, 'local-helper', 'SKILL.md'), 'local-helper');
  pathHashCache.clear();

  const { items } = await scanTier2UserSkills({ limits: { maxFiles: 10, maxFileBytes: 1024 } });

  assert.equal(items.length, 1);
  assert.equal(items[0].editor, 'my-skills');
  assert.equal(items[0].source, 'tier2-user');
  assert.equal(items[0].tierId, 'tier-2');
});

test('Tier 3 其他技能写入 other-skills editor 并保留稳定 source', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-tier3-editor-'));
  const oldConfigs = OTHER_TIER_3_CONFIGS.map(config => ({ ...config }));

  t.after(() => {
    OTHER_TIER_3_CONFIGS.splice(0, OTHER_TIER_3_CONFIGS.length, ...oldConfigs);
    pathHashCache.clear();
    fs.rmSync(root, { recursive: true, force: true });
  });

  OTHER_TIER_3_CONFIGS.splice(0, OTHER_TIER_3_CONFIGS.length, {
    name: 'Test Other Skills',
    path: root,
  });
  writeSkill(path.join(root, 'external-helper', 'skill.md'), 'external-helper');
  pathHashCache.clear();

  const { items } = await scanTier3OtherSkills({ limits: { maxFiles: 10, maxFileBytes: 1024 } });

  assert.equal(items.length, 1);
  assert.equal(items[0].editor, 'other-skills');
  assert.equal(items[0].source, 'tier3-other');
  assert.equal(items[0].tierId, 'tier-3');
});
