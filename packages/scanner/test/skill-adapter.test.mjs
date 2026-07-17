// Tests for scanSkills R7 behavior: two-stage (mini/full) + stable ordering.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { scanSkills } from '../src/adapters/skill-adapter.mjs';

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-skills-'));
  const write = (rel, content) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  write('zebra/SKILL.md', '---\nname: zebra\ndescription: last alphabetically\ntags: [z1, z2]\n---\n# Zebra body');
  write('alpha/SKILL.md', '---\nname: alpha\ndescription: first alphabetically\ntags: [a1]\nicon: "emoji:🅰️"\n---\n# Alpha body');
  write('mid/SKILL.md', '---\nname: mid\ndescription: middle\n---\n# Mid body');
  return dir;
}

test('scanSkills full stage returns rich fields', async () => {
  const dir = makeFixture();
  const { items, stats } = await scanSkills({ roots: [dir], stage: 'full' });
  assert.equal(items.length, 3);
  assert.equal(stats.stage, 'full');
  const alpha = items.find(i => i.name === 'alpha');
  assert.deepEqual(alpha.tags, ['a1']);
  assert.ok(alpha.raw.includes('Alpha body'), 'full stage includes raw');
  assert.ok(alpha.preview.length > 0, 'full stage includes preview');
  assert.equal(alpha.icon, 'emoji:🅰️', 'frontmatter icon passed through');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('scanSkills mini stage omits heavy fields but keeps display data', async () => {
  const dir = makeFixture();
  const { items, stats } = await scanSkills({ roots: [dir], stage: 'mini' });
  assert.equal(items.length, 3);
  assert.equal(stats.stage, 'mini');
  const alpha = items.find(i => i.name === 'alpha');
  assert.equal(alpha.description, 'first alphabetically');
  assert.equal(alpha.icon, 'emoji:🅰️');
  assert.equal(alpha.tags, undefined, 'mini omits tags');
  assert.equal(alpha.raw, undefined, 'mini omits raw');
  assert.equal(alpha.preview, undefined, 'mini omits preview');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('scanSkills returns a stable path-sorted order regardless of concurrency', async () => {
  const dir = makeFixture();
  const a = await scanSkills({ roots: [dir], concurrency: 1 });
  const b = await scanSkills({ roots: [dir], concurrency: 8 });
  const names = x => x.items.map(i => i.name);
  assert.deepEqual(names(a), names(b), 'order independent of concurrency');
  // Sorted by absolute path → alpha, mid, zebra
  assert.deepEqual(names(a), ['alpha', 'mid', 'zebra']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('scanSkills reports duration and handles empty roots', async () => {
  const empty = await scanSkills({ roots: ['/nonexistent-path-xyz'] });
  assert.equal(empty.items.length, 0);
  assert.equal(empty.stats.available, false);

  const dir = makeFixture();
  const { stats } = await scanSkills({ roots: [dir] });
  assert.equal(typeof stats.duration, 'number');
  fs.rmSync(dir, { recursive: true, force: true });
});
