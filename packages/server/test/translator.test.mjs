import assert from 'node:assert/strict';
import test from 'node:test';

import { translateSkill } from '../src/translator.mjs';

test('translateSkill: 无 ANTHROPIC_API_KEY 时返回原 skill 且不抛错', async () => {
  const oldKey = process.env.ANTHROPIC_API_KEY;
  const oldWarn = console.warn;
  delete process.env.ANTHROPIC_API_KEY;
  console.warn = () => {};

  const skill = {
    id: 'demo',
    name: 'Demo Skill',
    description: 'Use demo APIs',
    category: 'Tools',
  };

  try {
    const translated = await translateSkill(skill, 'zh-CN');
    assert.equal(translated, skill);
  } finally {
    if (oldKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = oldKey;
    }
    console.warn = oldWarn;
  }
});
