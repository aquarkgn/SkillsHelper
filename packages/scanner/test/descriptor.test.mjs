import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateDescriptor,
  registerDescriptor,
  registerDescriptors,
  getDescriptor,
  listDescriptors,
  descriptorsByTier,
  computeConfidence,
  _resetForTest,
} from '../src/core/descriptor.mjs';
import { ensureRegistered, reload, _resetForTest as resetRegistry, listDescriptors as listFromRegistry } from '../src/core/registry.mjs';

/**
 * 阶段一：descriptor registry 与置信度测试。
 */

test('validateDescriptor: 合法 descriptor 通过校验', () => {
  _resetForTest();
  resetRegistry();
  assert.doesNotThrow(() => validateDescriptor({
    id: 'test-1',
    tier: 'tier-1',
    brand: 'test',
    label: 'Test',
    detect: { globalPath: '~/test', globPatterns: ['**/SKILL.md'] },
  }));
});

test('validateDescriptor: 缺失必填字段抛错', () => {
  _resetForTest();
  resetRegistry();
  assert.throws(() => validateDescriptor({ id: 'x', tier: 'tier-1' }), /缺失必填字段/);
  assert.throws(() => validateDescriptor({ id: 'x', tier: 'bad', brand: 'b', label: 'l', detect: {} }), /tier 非法/);
  assert.throws(() => validateDescriptor({
    id: 'x', tier: 'tier-1', brand: 'b', label: 'l',
    detect: { globalPath: '~/x', globPatterns: [] },
  }), /globPatterns 必须是非空数组/);
});

test('registerDescriptor / getDescriptor: 注册后可查询', () => {
  _resetForTest();
  resetRegistry();
  const desc = {
    id: 'test-query',
    tier: 'tier-2',
    brand: 'b',
    label: 'L',
    detect: { globalPath: '~/x', globPatterns: ['**/SKILL.md'] },
  };
  registerDescriptor(desc);
  assert.equal(getDescriptor('test-query'), desc);
  assert.equal(getDescriptor('not-exist'), null);
});

test('registerDescriptor: 同 id 覆盖（支持热修）', () => {
  _resetForTest();
  resetRegistry();
  registerDescriptor({ id: 'dup', tier: 'tier-1', brand: 'a', label: 'A', detect: { globalPath: '~/a', globPatterns: ['**/SKILL.md'] } });
  registerDescriptor({ id: 'dup', tier: 'tier-1', brand: 'b', label: 'B', detect: { globalPath: '~/b', globPatterns: ['**/SKILL.md'] } });
  assert.equal(getDescriptor('dup').brand, 'b');
});

test('registerDescriptors: 批量注册', () => {
  _resetForTest();
  resetRegistry();
  registerDescriptors([
    { id: 'b1', tier: 'tier-1', brand: 'a', label: 'A', detect: { globalPath: '~/a', globPatterns: ['**/SKILL.md'] } },
    { id: 'b2', tier: 'tier-2', brand: 'b', label: 'B', detect: { globalPath: '~/b', globPatterns: ['**/SKILL.md'] } },
  ]);
  assert.equal(listDescriptors().length, 2);
});

test('listDescriptors: 按 tier 排序 (tier-1 < tier-2 < tier-3)', () => {
  _resetForTest();
  resetRegistry();
  registerDescriptors([
    { id: 't3', tier: 'tier-3', brand: 'c', label: 'C', detect: { globalPath: '~/c', globPatterns: ['**/SKILL.md'] } },
    { id: 't1', tier: 'tier-1', brand: 'a', label: 'A', detect: { globalPath: '~/a', globPatterns: ['**/SKILL.md'] } },
    { id: 't2', tier: 'tier-2', brand: 'b', label: 'B', detect: { globalPath: '~/b', globPatterns: ['**/SKILL.md'] } },
  ]);
  const ids = listDescriptors().map(d => d.id);
  assert.deepEqual(ids, ['t1', 't2', 't3']);
});

test('descriptorsByTier: 按 tier 过滤', () => {
  _resetForTest();
  resetRegistry();
  registerDescriptors([
    { id: 't1a', tier: 'tier-1', brand: 'a', label: 'A', detect: { globalPath: '~/a', globPatterns: ['**/SKILL.md'] } },
    { id: 't1b', tier: 'tier-1', brand: 'b', label: 'B', detect: { globalPath: '~/b', globPatterns: ['**/SKILL.md'] } },
    { id: 't2a', tier: 'tier-2', brand: 'c', label: 'C', detect: { globalPath: '~/c', globPatterns: ['**/SKILL.md'] } },
  ]);
  assert.equal(descriptorsByTier('tier-1').length, 2);
  assert.equal(descriptorsByTier('tier-2').length, 1);
  assert.equal(descriptorsByTier('tier-3').length, 0);
});

test('computeConfidence: 四级判定', () => {
  // 目录不存在 -> null
  assert.equal(computeConfidence({ dirExists: false, matchedFiles: 0, parsedValid: 0, metadataComplete: 0 }), null);
  // 只发现目录 -> L1
  assert.equal(computeConfidence({ dirExists: true, matchedFiles: 0, parsedValid: 0, metadataComplete: 0 }), 'L1');
  // 命中文件但未解析成功 -> L2
  assert.equal(computeConfidence({ dirExists: true, matchedFiles: 3, parsedValid: 0, metadataComplete: 0 }), 'L2');
  // 解析有效但元数据不全 -> L3
  assert.equal(computeConfidence({ dirExists: true, matchedFiles: 3, parsedValid: 2, metadataComplete: 0 }), 'L3');
  // 元数据完整 -> L4
  assert.equal(computeConfidence({ dirExists: true, matchedFiles: 3, parsedValid: 3, metadataComplete: 1 }), 'L4');
});

test('registry.registerAll: 从 editor-tiers.mjs 派生并注册全部 descriptor', () => {
  _resetForTest();
  resetRegistry();
  reload();
  const all = listFromRegistry();
  // 22 (tier1) + 1 (tier2) + 3 (tier3) = 26
  assert.equal(all.length, 26);
  assert.equal(descriptorsByTier('tier-1').length, 22);
  assert.equal(descriptorsByTier('tier-2').length, 1);
  assert.equal(descriptorsByTier('tier-3').length, 3);
});

test('registry: tier1 descriptor 含 globalPath/projectPath/ignore/deep', () => {
  _resetForTest();
  resetRegistry();
  reload();
  const claude = getDescriptor('tier1:claude');
  assert.ok(claude);
  assert.equal(claude.brand, 'claude');
  assert.equal(claude.detect.globalPath, '~/.claude/skills');
  assert.equal(claude.detect.projectPath, '.claude/skills');
  assert.ok(Array.isArray(claude.detect.globPatterns));
  assert.ok(claude.detect.globPatterns.length > 0);
  assert.ok(claude.detect.ignore.includes('**/node_modules/**'));
  assert.equal(claude.detect.deep, 10);
});

test('registry: tier2 与 tier3 descriptor 各自的 glob 模式正确', () => {
  _resetForTest();
  resetRegistry();
  reload();
  const t2 = getDescriptor('tier2:user-skills');
  assert.ok(t2);
  // tier2 两种模式（SKILL.md + skill.md）
  assert.equal(t2.detect.globPatterns.length, 2);

  const t3 = getDescriptor('tier3:Homebrew');
  assert.ok(t3);
  // tier3 仅小写 skill.md（有意的大小写敏感）
  assert.equal(t3.detect.globPatterns.length, 1);
  assert.equal(t3.detect.globPatterns[0], '**/skill.md');
});

test('ensureRegistered: 幂等，重复调用不报错', () => {
  _resetForTest();
  resetRegistry();
  ensureRegistered();
  ensureRegistered();
  ensureRegistered();
  assert.ok(listFromRegistry().length > 0);
});
