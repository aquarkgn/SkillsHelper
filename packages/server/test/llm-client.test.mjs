import assert from 'node:assert/strict';
import test from 'node:test';

import { ANTHROPIC_MODEL, callAnthropic } from '../src/llm-client.mjs';

function withEnvAndFetch(options, run) {
  const apiKey = Object.hasOwn(options, 'apiKey') ? options.apiKey : 'test-key';
  const { fetchImpl } = options;
  const oldKey = process.env.ANTHROPIC_API_KEY;
  const oldFetch = globalThis.fetch;
  if (apiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = apiKey;
  }
  globalThis.fetch = fetchImpl;

  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (oldKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = oldKey;
      }
      globalThis.fetch = oldFetch;
    });
}

test('callAnthropic: 成功时返回文本并透传 max_tokens', async () => {
  let request;
  await withEnvAndFetch({
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        async json() {
          return { content: [{ text: '{"ok":true}' }] };
        },
      };
    },
  }, async () => {
    const text = await callAnthropic('hello', { max_tokens: 4096 });
    assert.equal(text, '{"ok":true}');
  });

  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['x-api-key'], 'test-key');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, ANTHROPIC_MODEL);
  assert.equal(body.max_tokens, 4096);
  assert.deepEqual(body.messages, [{ role: 'user', content: 'hello' }]);
});

test('callAnthropic: API 错误时抛出状态与响应正文', async () => {
  await withEnvAndFetch({
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      async text() {
        return 'rate limited';
      },
    }),
  }, async () => {
    await assert.rejects(
      callAnthropic('hello', { max_tokens: 100 }),
      /Anthropic API: 429 rate limited/,
    );
  });
});

test('callAnthropic: 无 ANTHROPIC_API_KEY 时抛错且不发请求', async () => {
  let called = false;
  await withEnvAndFetch({
    apiKey: undefined,
    fetchImpl: async () => {
      called = true;
      throw new Error('should not fetch');
    },
  }, async () => {
    await assert.rejects(
      callAnthropic('hello', { max_tokens: 100 }),
      /ANTHROPIC_API_KEY not set/,
    );
  });
  assert.equal(called, false);
});

test('callAnthropic: max_tokens 必须显式传入正整数', async () => {
  await withEnvAndFetch({
    fetchImpl: async () => {
      throw new Error('should not fetch');
    },
  }, async () => {
    await assert.rejects(
      callAnthropic('hello', {}),
      /max_tokens must be a positive integer/,
    );
  });
});
