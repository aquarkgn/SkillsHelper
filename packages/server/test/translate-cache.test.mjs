import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { getCached, setCached, flush, size, _resetForTest } from '../src/translate-cache.mjs';
import { translateCacheFile } from '../../../bin/lib/paths.mjs';

function makeTempHome() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-tc-test-'));
  process.env.SKILLHELPER_HOME = root;
  return root;
}

test('translate-cache: 写入后内存可读', () => {
  _resetForTest();
  makeTempHome();
  setCached('hello world', '你好世界', 'en');
  assert.equal(size(), 1);
  const c = getCached('hello world');
  assert.equal(c.result, '你好世界');
  assert.equal(c.from, 'en');
  assert.equal(c.to, 'zh-CN');
});

test('translate-cache: 未命中返回 null', () => {
  _resetForTest();
  makeTempHome();
  assert.equal(getCached('not exist'), null);
});

test('translate-cache: 相同文本命中同一缓存条目（md5 共享）', () => {
  _resetForTest();
  makeTempHome();
  setCached('same text', '相同文本', 'en');
  const c = getCached('same text');
  assert.equal(c.result, '相同文本');
});

test('translate-cache: 落盘后跨重启复用', () => {
  _resetForTest();
  const root = makeTempHome();
  setCached('persist me', '持久化内容', 'en');
  flush();

  // 模拟重启：重置内存缓存，下次查询会从磁盘重新加载
  _resetForTest();
  const c = getCached('persist me');
  assert.equal(c.result, '持久化内容');
  assert.ok(fs.existsSync(translateCacheFile()), '磁盘缓存文件应存在');

  fs.rmSync(root, { recursive: true, force: true });
});

test('translate-cache: 文本变化后 md5 不同，自动失效', () => {
  _resetForTest();
  makeTempHome();
  setCached('old content', '旧译文', 'en');
  // 文本变化（文件更新），新 md5 未命中
  assert.equal(getCached('new content'), null);
  assert.equal(getCached('old content').result, '旧译文');
});

test('translate-cache: 供应商不同不复用译文', () => {
  _resetForTest();
  makeTempHome();
  setCached('provider text', 'Google 译文', 'en', { provider: 'google' });
  assert.equal(getCached('provider text', { provider: 'google' }).result, 'Google 译文');
  assert.equal(getCached('provider text', { provider: 'aliyun' }), null);
});

test('translate-cache: v1 缓存按原文迁移后仍可读取', () => {
  _resetForTest();
  makeTempHome();
  const legacyKey = crypto.createHash('md5').update('legacy text', 'utf8').digest('hex');
  fs.mkdirSync(path.dirname(translateCacheFile()), { recursive: true });
  fs.writeFileSync(translateCacheFile(), JSON.stringify({
    version: 1,
    entries: {
      [legacyKey]: { text: 'legacy text', result: '旧译文', from: 'en', to: 'zh-CN' },
    },
  }));
  const cached = getCached('legacy text');
  assert.equal(cached.result, '旧译文');
});

test('translate-cache: LRU 超限时淘汰最旧条目', () => {
  _resetForTest();
  makeTempHome();
  process.env.SKILLHELPER_TRANSLATE_CACHE_MAX = '3'; // 测试用小上限
  // 重新加载模块级常量需重新 import，但 MAX_ENTRIES 在模块加载时读取。
  // 此处验证已加载模块的行为：用 _resetForTest 后写入超过上限的条目。
  // 注意：因 MAX_ENTRIES 在 import 时固化，此测试依赖测试启动时的 env。
  setCached('text-1', '译文-1', 'en');
  setCached('text-2', '译文-2', 'en');
  setCached('text-3', '译文-3', 'en');
  setCached('text-4', '译文-4', 'en'); // 超限，text-1 应被淘汰
  assert.equal(getCached('text-1'), null, 'text-1 应被 LRU 淘汰');
  assert.equal(getCached('text-4').result, '译文-4');
  delete process.env.SKILLHELPER_TRANSLATE_CACHE_MAX;
});

test('translate-cache: LRU 命中时移到末尾（避免热条目被淘汰）', () => {
  _resetForTest();
  makeTempHome();
  process.env.SKILLHELPER_TRANSLATE_CACHE_MAX = '3';
  setCached('a', '甲', 'en');
  setCached('b', '乙', 'en');
  setCached('c', '丙', 'en');
  // 访问 a，将其移到末尾（最近使用）
  getCached('a');
  // 写入 d，应淘汰最旧的 b（而非 a）
  setCached('d', '丁', 'en');
  assert.equal(getCached('a').result, '甲', 'a 刚被访问，不应被淘汰');
  assert.equal(getCached('b'), null, 'b 应被淘汰');
  assert.equal(getCached('d').result, '丁');
  delete process.env.SKILLHELPER_TRANSLATE_CACHE_MAX;
});
