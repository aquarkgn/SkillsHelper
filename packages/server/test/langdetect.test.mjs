import assert from 'node:assert/strict';
import test from 'node:test';

import { isChinese, detectLanguage } from '../src/langdetect.mjs';

test('isChinese: 纯中文判定为中文', () => {
  assert.equal(isChinese('生成日报周报文案，支持法定节假日'), true);
});

test('isChinese: 纯英文判定为非中文', () => {
  assert.equal(isChinese('Auto-review pipeline reads the full CEO design'), false);
});

test('isChinese: 中英混排且中文为主判定为中文', () => {
  assert.equal(isChinese('使用 MCP 协议连接外部工具，支持 streaming 输出和断点续传'), true);
});

test('isChinese: 中英混排且英文为主判定为非中文', () => {
  assert.equal(isChinese('Use this skill for MCP server management'), false);
});

test('isChinese: 空文本或 null 视为中文（无需翻译）', () => {
  assert.equal(isChinese(''), true);
  assert.equal(isChinese(null), true);
  assert.equal(isChinese(undefined), true);
  assert.equal(isChinese('   \n  '), true);
});

test('isChinese: 仅标点数字判定为非中文', () => {
  assert.equal(isChinese('12345 --- !!!'), false);
});

test('detectLanguage: 中文返回 zh', () => {
  assert.equal(detectLanguage('生成日报周报文案'), 'zh');
  assert.equal(detectLanguage('使用 MCP 协议连接外部工具'), 'zh');
});

test('detectLanguage: 英文返回 en', () => {
  assert.equal(detectLanguage('Auto-review pipeline'), 'en');
  assert.equal(detectLanguage('Use this skill for MCP server management'), 'en');
});

test('detectLanguage: 空文本返回 unknown', () => {
  assert.equal(detectLanguage(''), 'unknown');
  assert.equal(detectLanguage(null), 'unknown');
  assert.equal(detectLanguage(undefined), 'unknown');
  assert.equal(detectLanguage('   \n  '), 'unknown');
});
