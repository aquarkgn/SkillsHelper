// translate-raw.test.mjs — 验证 /api/translate-raw 的超时填充逻辑 + splitSegments 切分
//
// 超时测试用 Date.now mock 让 deadline 立即到，避免真等 12s。
// mock 只影响 translate-raw 路由内的 Date.now() 调用（deadline 计算与
// worker 检查），server 其他路径用 new Date() 不受影响。
// translate 因 deadline 立即到而不被调用，不写翻译缓存，无副作用。
//
// splitSegments 测试不启动 server，直接验证切分逻辑（代码块跳过、段落切分）。

import test from 'node:test';
import assert from 'node:assert/strict';

import { startServer, splitSegments } from '../src/index.mjs';

test('splitSegments: 代码块整体保留为 code 类型', () => {
  const text = '段落一\n\n```js\nconst x = 1;\n```\n\n段落二';
  const segs = splitSegments(text);
  assert.equal(segs.length, 3);
  assert.equal(segs[0].type, 'text');
  assert.equal(segs[1].type, 'code');
  assert.equal(segs[2].type, 'text');
  assert.ok(segs[1].text.includes('const x = 1'), '代码块内容应完整保留');
});

test('splitSegments: 空文本返回空数组', () => {
  assert.deepEqual(splitSegments(''), []);
  assert.deepEqual(splitSegments('   \n\n  '), []);
});

test('splitSegments: 多个代码块与文本交替', () => {
  const text = '```\ncode1\n```\n\n中间文本\n\n```\ncode2\n```';
  const segs = splitSegments(text);
  assert.equal(segs.filter((s) => s.type === 'code').length, 2);
  assert.equal(segs.filter((s) => s.type === 'text').length, 1);
});

test('splitSegments: ~~~ 围栏代码块也识别', () => {
  const text = '文本\n\n~~~\ntilde code\n~~~\n\n结尾';
  const segs = splitSegments(text);
  assert.equal(segs.filter((s) => s.type === 'code').length, 1);
  assert.ok(segs.some((s) => s.type === 'code' && s.text.includes('tilde code')));
});

test('translate-raw: deadline 到达后未翻译段填充原文 skipped:timeout', async () => {
  // 用默认 SKILLHELPER_HOME（读真实 sources.yaml 以扫描到技能）。
  // translate 因 deadline 立即到而不被调用，不写缓存，无副作用。
  const { app, port } = await startServer({ port: 0 });

  // mock Date.now：每次调用递增 20000ms。
  // deadline = (第 N 次返回) + 12000，worker 检查 = 第 N+1 次返回 = 第 N 次 + 20000
  // → worker 第一次检查就 > deadline，立即 break。
  // 递增方式避免依赖"第几次调用"（onRequest 钩子也会调 Date.now）。
  const realDateNow = Date.now;
  let nowBase = 0;
  Date.now = () => {
    const v = nowBase;
    nowBase += 20000;
    return v;
  };

  try {
    const skillsRes = await fetch(`http://127.0.0.1:${port}/api/skills`);
    const skills = await skillsRes.json();
    if (!skills.length) {
      assert.ok(true, '无技能数据，跳过');
      return;
    }
    const detailRes = await fetch(`http://127.0.0.1:${port}/api/skills/${encodeURIComponent(skills[0].id)}`);
    const detail = await detailRes.json();
    if (!detail.raw || !detail.raw.trim()) {
      assert.ok(true, '技能无正文，跳过');
      return;
    }

    const res = await fetch(`http://127.0.0.1:${port}/api/translate-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: skills[0].id }),
    });
    const text = await res.text();
    const lines = text.split('\n').filter((l) => l.trim());
    const msgs = lines.map((l) => JSON.parse(l));
    const doneMsg = msgs.find((m) => m.type === 'done');
    assert.ok(doneMsg, '应有 done 消息');
    assert.ok(Array.isArray(doneMsg.segments), 'done 应含 segments 数组');
    // deadline 立即到，所有文本段应为 timeout；代码段为 code
    const textSegs = doneMsg.segments.filter((s) => s.skipped !== 'code');
    assert.ok(
      textSegs.every((s) => s.skipped === 'timeout'),
      'deadline 到达后未翻译的文本段应填充原文并标记 timeout',
    );
  } finally {
    Date.now = realDateNow;
    await app.close();
  }
});

test('translate-raw: 不存在的 id 返回 404', async () => {
  const { app, port } = await startServer({ port: 0 });
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/translate-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'nonexistent-id-xxx' }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, 'not found');
  } finally {
    await app.close();
  }
});

test('translate: 未配置的国内供应商明确返回失败，不把原文伪装为译文', async () => {
  const previous = process.env.SKILLHELPER_TRANSLATION_PROVIDER;
  process.env.SKILLHELPER_TRANSLATION_PROVIDER = 'aliyun';
  const { app, port } = await startServer({ port: 0 });
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Translate this sentence.' }),
    });
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.status, 'failed');
    assert.equal(body.provider, 'aliyun');
    assert.match(body.error, /尚未配置/);
  } finally {
    if (previous === undefined) delete process.env.SKILLHELPER_TRANSLATION_PROVIDER;
    else process.env.SKILLHELPER_TRANSLATION_PROVIDER = previous;
    await app.close();
  }
});
