import assert from 'node:assert/strict';
import test from 'node:test';

import {
  digestCommands,
  digestSubcommandHelpFiles,
  parseJsonOutput,
  validateCliCommand,
  validateCliSubcommandHelp,
} from './digest-commands.mjs';

const EXPECTED_BRANDS = ['claude', 'code', 'codex', 'gstack', 'hermes'];

function brandFromPrompt(prompt) {
  const match = prompt.match(/brand 必须是 "([^"]+)"/);
  assert.ok(match, 'prompt 应包含品牌约束');
  return match[1];
}

function fakeCommand(brand) {
  return {
    brand,
    version: brand === 'code' ? '1.126.0' : undefined,
    summary_zh: `${brand} 的命令能力摘要`,
    groups: [{
      name_zh: '基础选项',
      source: 'explicit',
      flags: [{
        name: '-h, --help',
        desc_zh: '显示帮助信息',
        raw: 'Print help',
      }],
    }],
    subcommands: [{
      name: 'doctor',
      desc_zh: '诊断本地安装和配置状态',
    }],
  };
}

test('digestCommands: 读取 5 个真实 .cmd fixture 并产出完整 schema', async () => {
  const seenPrompts = [];
  const { commands, failures } = await digestCommands({
    writeOutput: false,
    llm: async (prompt, options) => {
      seenPrompts.push(prompt);
      assert.equal(options.max_tokens, 4096);
      assert.match(prompt, /^\[→EVAL\]/);
      return JSON.stringify(fakeCommand(brandFromPrompt(prompt)));
    },
  });

  assert.deepEqual(failures, []);
  assert.deepEqual(commands.map((command) => command.brand), EXPECTED_BRANDS);
  assert.equal(seenPrompts.length, 5);

  for (const command of commands) {
    validateCliCommand(command);
    assert.ok(command.summary_zh.trim());
    assert.ok(command.groups.length > 0);
    assert.ok(command.groups.some((group) => group.flags.length > 0));
  }
});

test('parseJsonOutput: 兼容误带 markdown 的 JSON 输出', () => {
  const parsed = parseJsonOutput('```json\n{"brand":"codex","summary_zh":"摘要","groups":[{"name_zh":"选项","source":"explicit","flags":[{"name":"--help","desc_zh":"帮助","raw":"help"}]}]}\n```');
  assert.equal(parsed.brand, 'codex');
});

test('validateCliCommand: 必填字段缺失时报错', () => {
  assert.throws(
    () => validateCliCommand({
      brand: 'codex',
      summary_zh: '摘要',
      groups: [{
        name_zh: '选项',
        source: 'explicit',
        flags: [{ name: '--help', raw: 'help' }],
      }],
    }),
    /desc_zh/,
  );
});


function subcommandFromPrompt(prompt) {
  const match = prompt.match(/subcommand 必须是 "([^"]+)"/);
  assert.ok(match, 'prompt 应包含子命令约束');
  return match[1];
}

function fakeSubcommandHelp(brand, subcommand) {
  return {
    brand,
    subcommand,
    summary_zh: `${brand} ${subcommand} 的子命令帮助`,
    usage: `${brand} ${subcommand} [options]`,
    groups: [{
      name_zh: '选项',
      source: 'explicit',
      flags: [{
        name: '--help',
        desc_zh: '显示帮助信息',
        raw: 'show help',
      }],
    }],
    raw: 'show help',
  };
}

test('digestSubcommandHelpFiles: 读取子命令 help fixture 并按品牌聚合', async () => {
  const seenPrompts = [];
  const { helpsByBrand, failures } = await digestSubcommandHelpFiles({
    writeOutput: false,
    llm: async (prompt, options) => {
      seenPrompts.push(prompt);
      assert.equal(options.max_tokens, 4096);
      assert.match(prompt, /CLI 子命令帮助整理器/);
      return JSON.stringify(fakeSubcommandHelp(brandFromPrompt(prompt), subcommandFromPrompt(prompt)));
    },
  });

  assert.deepEqual(failures, []);
  assert.ok(seenPrompts.length >= 15);
  assert.ok(helpsByBrand.get('codex').some((help) => help.subcommand === 'exec'));
  assert.ok(helpsByBrand.get('hermes').some((help) => help.subcommand === 'skills'));

  for (const helps of helpsByBrand.values()) {
    for (const help of helps) validateCliSubcommandHelp(help);
  }
});

test('validateCliSubcommandHelp: 必填字段缺失时报错', () => {
  assert.throws(
    () => validateCliSubcommandHelp({
      brand: 'codex',
      subcommand: 'exec',
      summary_zh: '摘要',
      groups: [{
        name_zh: '选项',
        source: 'explicit',
        flags: [{ name: '--help', raw: 'help' }],
      }],
    }),
    /desc_zh/,
  );
});
