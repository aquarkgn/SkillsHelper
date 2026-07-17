/**
 * @file scan-tier.test.mjs
 * 路径哈希与 LRU 缓存的单元测试
 *
 * 用 node:test 风格，与 packages/scanner/test 其他测试一致。
 * 原文件用 vitest 风格 + 错误的 import 路径（'../hash/...' 应为 '../src/hash/...'），
 * 导致 npm test（node --test）无法运行。统一为 node:test。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { getPathHash, PathHashCache } from '../src/hash/path-hash.mjs';

test('Path Hash: 路径规范化后哈希一致（~ 与绝对路径等价）', () => {
  const home = os.homedir();
  const path1 = `${home}/skills/test/SKILL.md`;
  const path2 = `~/skills/test/SKILL.md`;
  const path3 = path.join(home, 'skills/test/SKILL.md');

  const hash1 = getPathHash(path1);
  const hash2 = getPathHash(path2);
  const hash3 = getPathHash(path3);

  assert.equal(hash1, hash2);
  assert.equal(hash2, hash3);
  assert.match(hash1, /^[a-f0-9]{32}$/); // MD5 格式
});

test('Path Hash: 不同路径哈希不同', () => {
  const hash1 = getPathHash('~/skills/skill1/SKILL.md');
  const hash2 = getPathHash('~/skills/skill2/SKILL.md');
  assert.notEqual(hash1, hash2);
});

test('Path Hash: 哈希稳定（相同输入多次调用返回相同值）', () => {
  const filePath = '~/skills/test/SKILL.md';
  assert.equal(getPathHash(filePath), getPathHash(filePath));
});

test('PathHashCache: 缓存计算过的哈希值', () => {
  const cache = new PathHashCache(5);
  const filePath = '~/skills/test/SKILL.md';
  const hash1 = cache.getOrCompute(filePath);
  const hash2 = cache.getOrCompute(filePath);
  assert.equal(hash1, hash2);
  assert.equal(cache.size, 1);
});

test('PathHashCache: 容量满时移除最旧条目', () => {
  const cache = new PathHashCache(5);
  const paths = [
    '~/skills/1/SKILL.md',
    '~/skills/2/SKILL.md',
    '~/skills/3/SKILL.md',
    '~/skills/4/SKILL.md',
    '~/skills/5/SKILL.md',
    '~/skills/6/SKILL.md', // 超限，第一个应被移除
  ];
  for (const p of paths) cache.getOrCompute(p);
  assert.equal(cache.size, 5);
  assert.equal(cache.get(paths[0]), undefined, '第一个应被淘汰');
  assert.notEqual(cache.get(paths[5]), undefined, '最新的应存在');
});

test('PathHashCache: 支持清空缓存', () => {
  const cache = new PathHashCache(5);
  cache.getOrCompute('~/skills/1/SKILL.md');
  cache.getOrCompute('~/skills/2/SKILL.md');
  assert.equal(cache.size, 2);
  cache.clear();
  assert.equal(cache.size, 0);
});
