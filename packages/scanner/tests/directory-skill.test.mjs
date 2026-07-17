// directory-skill.test.mjs — unit tests for directory-skill adapter
//
// Tests cover:
// 1. Successfully scanning a directory with SKILL.md files
// 2. Proper tier assignment (tier='directory')
// 3. dirName field population
// 4. Empty directory handling
// 5. File glob filtering

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDirectorySkills } from '../src/adapters/directory-skill.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures/directory-skill');

test('scanDirectorySkills: basic scanning', async () => {
  const result = await scanDirectorySkills({
    paths: [FIXTURES_DIR],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 100, maxFileBytes: 1024 * 1024 },
  });

  assert.ok(result.items, 'items array should exist');
  assert(Array.isArray(result.items), 'items should be an array');
  assert(result.stats, 'stats should exist');
  assert.equal(result.stats.source, 'directory', 'source should be "directory"');
});

test('scanDirectorySkills: tier assignment', async () => {
  const result = await scanDirectorySkills({
    paths: [FIXTURES_DIR],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 100, maxFileBytes: 1024 * 1024 },
  });

  for (const item of result.items) {
    assert.equal(item.tier, 'directory', `tier should be "directory" for item ${item.name}`);
    assert.ok(item.dirName, `dirName should be set for item ${item.name}`);
    assert.equal(item.source, 'directory', `source should be "directory" for item ${item.name}`);
  }
});

test('scanDirectorySkills: empty directory', async () => {
  const result = await scanDirectorySkills({
    paths: ['/nonexistent/path'],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 100, maxFileBytes: 1024 * 1024 },
  });

  assert.equal(result.items.length, 0, 'should return empty list for non-existent path');
  assert.equal(result.stats.available, false, 'stats.available should be false');
});

test('scanDirectorySkills: no paths provided', async () => {
  const result = await scanDirectorySkills({
    paths: [],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 100, maxFileBytes: 1024 * 1024 },
  });

  assert.equal(result.items.length, 0, 'should return empty list when paths is empty');
  assert.equal(result.stats.available, false, 'stats.available should be false');
});

test('scanDirectorySkills: dirName extraction', async () => {
  const result = await scanDirectorySkills({
    paths: [FIXTURES_DIR],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 100, maxFileBytes: 1024 * 1024 },
  });

  for (const item of result.items) {
    // dirName should be the parent directory of SKILL.md
    assert.ok(item.dirName, `dirName should exist for ${item.name}`);
    assert(item.dirName.length > 0, `dirName should not be empty for ${item.name}`);
    // dirName should match the dir part of the path
    const expectedDirName = path.basename(path.dirname(item.paths.abs));
    assert.equal(item.dirName, expectedDirName, `dirName should match directory name for ${item.name}`);
  }
});

test('scanDirectorySkills: file limits respected', async () => {
  const result = await scanDirectorySkills({
    paths: [FIXTURES_DIR],
    globs: ['**/SKILL.md'],
    limits: { maxFiles: 1, maxFileBytes: 1024 * 1024 },
  });

  assert(result.items.length <= 1, 'should respect maxFiles limit');
});
