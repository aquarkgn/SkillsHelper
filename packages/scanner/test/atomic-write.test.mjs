import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { atomicWriteText, atomicWriteBytes, atomicWriteJson } from '../src/core/atomic-write.mjs';

/**
 * 阶段零：原子写工具测试。
 * 覆盖：正常写、内容完整、不残留临时文件、覆盖写、JSON 格式、二进制。
 */

test('atomicWriteText 写入内容完整且不残留临时文件', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-aw-text-'));
  const file = path.join(dir, 'out.txt');
  try {
    atomicWriteText(file, 'hello 原子写\n');
    assert.equal(fs.readFileSync(file, 'utf8'), 'hello 原子写\n');
    // 不残留 .tmp 文件
    const tmps = fs.readdirSync(dir).filter(f => f.includes('.tmp.'));
    assert.deepEqual(tmps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('atomicWriteText 覆盖已存在文件不残留临时文件', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-aw-overwrite-'));
  const file = path.join(dir, 'out.txt');
  try {
    fs.writeFileSync(file, 'old content');
    atomicWriteText(file, 'new content');
    assert.equal(fs.readFileSync(file, 'utf8'), 'new content');
    const tmps = fs.readdirSync(dir).filter(f => f.includes('.tmp.'));
    assert.deepEqual(tmps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('atomicWriteJson 输出 pretty 格式与原 writeJson 一致', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-aw-json-'));
  const file = path.join(dir, 'out.json');
  try {
    atomicWriteJson(file, { version: 1, items: ['a', 'b'] });
    const text = fs.readFileSync(file, 'utf8');
    // 与 bin/lib/paths.mjs 原 writeJson 的 JSON.stringify(obj, null, 2) 格式一致
    assert.equal(text, JSON.stringify({ version: 1, items: ['a', 'b'] }, null, 2));
    // 可被 JSON.parse 还原
    assert.deepEqual(JSON.parse(text), { version: 1, items: ['a', 'b'] });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('atomicWriteBytes 写入二进制内容完整', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-aw-bytes-'));
  const file = path.join(dir, 'icon.png');
  try {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG 签名
    atomicWriteBytes(file, bytes);
    const read = fs.readFileSync(file);
    assert.deepEqual(read, bytes);
    const tmps = fs.readdirSync(dir).filter(f => f.includes('.tmp.'));
    assert.deepEqual(tmps, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('atomicWriteText 自动创建父目录', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'huhaa-aw-mkdir-'));
  const file = path.join(dir, 'nested', 'deep', 'out.txt');
  try {
    atomicWriteText(file, 'nested');
    assert.equal(fs.readFileSync(file, 'utf8'), 'nested');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('re-export 路径兼容：hash/path-hash.mjs 仍导出全部符号', async () => {
  // 确保阶段零迁移后，原有 7 处 import 路径不破坏
  const legacy = await import('../src/hash/path-hash.mjs');
  const core = await import('../src/core/path-hash.mjs');
  assert.equal(typeof legacy.getPathHash, 'function');
  assert.equal(typeof legacy.PathHashCache, 'function');
  assert.ok(legacy.pathHashCache, 'pathHashCache 单例应存在');
  // re-export 与 core 是同一引用
  assert.equal(legacy.getPathHash, core.getPathHash);
  assert.equal(legacy.pathHashCache, core.pathHashCache);
});

test('re-export 计算结果与 core 一致', async () => {
  const legacy = await import('../src/hash/path-hash.mjs');
  const core = await import('../src/core/path-hash.mjs');
  assert.equal(legacy.getPathHash('/tmp/x'), core.getPathHash('/tmp/x'));
});
