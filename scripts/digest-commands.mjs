#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { callAnthropic } from '../packages/server/src/llm-client.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOURCE_DIR = path.join(ROOT, 'source');
const DEFAULT_OUTPUT_FILE = path.join(ROOT, 'packages/web/src/data/commands.json');
const DEFAULT_SUBCOMMAND_HELP_SOURCE_DIR = path.join(ROOT, 'source/command-help');
const DEFAULT_SUBCOMMAND_HELP_OUTPUT_DIR = path.join(ROOT, 'packages/web/src/data/command-help');

export function buildDigestPrompt({ brand, helpText }) {
  return `[→EVAL]
你是 CLI 命令能力地图整理器。请把下面 ${brand} 的 --help 文本消化成结构化 JSON，用于中文网页展示。

必须严格遵守：
- 只返回 JSON，不要 markdown，不要代码围栏，不要解释
- brand 必须是 "${brand}"
- 提取全部可见 flag/options，不得遗漏
- 若原 help 有显式节标题（如 Commands、Options、Troubleshooting、Extensions Management），对应分组 source 用 "explicit"
- 若原 help 没有显式节标题，请按语义分组，source 用 "inferred"
- 中文说明保留 API、MCP、LLM、JSON、TUI、IDE 等技术术语原文
- 子命令只放到 subcommands，存 name + 一句话中文 desc_zh，不展开子命令帮助
- flags 中 name 放短/长参数名原文，如 "-h, --help" 或 "--model"
- flags 中 args 放参数占位符，如 "<file>"、"PROMPT"；没有参数则省略
- flags 中 raw 保留原英文说明，方便人工校对

JSON schema:
{
  "brand": "string",
  "version": "string 可选",
  "summary_zh": "string",
  "groups": [
    {
      "name_zh": "string",
      "source": "inferred 或 explicit",
      "flags": [
        {
          "name": "string",
          "args": "string 可选",
          "desc_zh": "string",
          "raw": "string"
        }
      ]
    }
  ],
  "subcommands": [
    {
      "name": "string",
      "desc_zh": "string"
    }
  ]
}

--help 文本如下：
${helpText}`;
}


export function buildSubcommandHelpDigestPrompt({ brand, subcommand, helpText }) {
  return `[→EVAL]
你是 CLI 子命令帮助整理器。请把下面 ${brand} ${subcommand} 的 --help 文本消化成结构化 JSON，用于中文网页的子命令 tab 详情展示。

必须严格遵守：
- 只返回 JSON，不要 markdown，不要代码围栏，不要解释
- brand 必须是 "${brand}"
- subcommand 必须是 "${subcommand}"
- summary_zh 用一句中文说明该子命令用途
- usage 保留原文 Usage / usage 行；若原文没有则省略
- 提取全部可见 flag/options/positional arguments，不得遗漏
- 若原 help 有显式节标题（如 Commands、Options、positional arguments），对应分组 source 用 "explicit"
- 若原 help 没有显式节标题，请按语义分组，source 用 "inferred"
- 中文说明保留 API、MCP、LLM、JSON、TUI、IDE 等技术术语原文
- flags 中 name 放短/长参数名或子命令名原文，如 "-h, --help"、"--model"、"install"
- flags 中 args 放参数占位符，如 "<file>"、"PROMPT"；没有参数则省略
- flags 中 raw 保留原英文说明，方便人工校对
- raw 保留原始 help 文本，方便用户展开校对

JSON schema:
{
  "brand": "string",
  "subcommand": "string",
  "summary_zh": "string",
  "usage": "string 可选",
  "groups": [
    {
      "name_zh": "string",
      "source": "inferred 或 explicit",
      "flags": [
        {
          "name": "string",
          "args": "string 可选",
          "desc_zh": "string",
          "raw": "string"
        }
      ]
    }
  ],
  "raw": "string 可选",
  "capturedAt": "string 可选",
  "sourcePath": "string 可选"
}

--help 文本如下：
${helpText}`;
}

export function parseJsonOutput(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('LLM output does not contain a JSON object');
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function assertNonEmptyString(value, pathLabel) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${pathLabel} must be a non-empty string`);
  }
}

export function validateCliCommand(command) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) {
    throw new Error('command must be an object');
  }
  assertNonEmptyString(command.brand, 'brand');
  if (command.version !== undefined && typeof command.version !== 'string') {
    throw new Error('version must be a string when present');
  }
  assertNonEmptyString(command.summary_zh, 'summary_zh');
  if (!Array.isArray(command.groups) || command.groups.length === 0) {
    throw new Error('groups must be a non-empty array');
  }

  command.groups.forEach((group, groupIndex) => {
    assertNonEmptyString(group?.name_zh, `groups[${groupIndex}].name_zh`);
    if (group.source !== 'inferred' && group.source !== 'explicit') {
      throw new Error(`groups[${groupIndex}].source must be inferred or explicit`);
    }
    if (!Array.isArray(group.flags)) {
      throw new Error(`groups[${groupIndex}].flags must be an array`);
    }
    group.flags.forEach((flag, flagIndex) => {
      assertNonEmptyString(flag?.name, `groups[${groupIndex}].flags[${flagIndex}].name`);
      if (flag.args !== undefined && typeof flag.args !== 'string') {
        throw new Error(`groups[${groupIndex}].flags[${flagIndex}].args must be a string when present`);
      }
      assertNonEmptyString(flag.desc_zh, `groups[${groupIndex}].flags[${flagIndex}].desc_zh`);
      assertNonEmptyString(flag.raw, `groups[${groupIndex}].flags[${flagIndex}].raw`);
    });
  });

  if (command.subcommands !== undefined) {
    if (!Array.isArray(command.subcommands)) {
      throw new Error('subcommands must be an array when present');
    }
    command.subcommands.forEach((subcommand, index) => {
      assertNonEmptyString(subcommand?.name, `subcommands[${index}].name`);
      assertNonEmptyString(subcommand.desc_zh, `subcommands[${index}].desc_zh`);
    });
  }
}


export function validateCliSubcommandHelp(help) {
  if (!help || typeof help !== 'object' || Array.isArray(help)) {
    throw new Error('subcommand help must be an object');
  }
  assertNonEmptyString(help.brand, 'brand');
  assertNonEmptyString(help.subcommand, 'subcommand');
  assertNonEmptyString(help.summary_zh, 'summary_zh');
  if (help.usage !== undefined && typeof help.usage !== 'string') {
    throw new Error('usage must be a string when present');
  }
  if (help.raw !== undefined && typeof help.raw !== 'string') {
    throw new Error('raw must be a string when present');
  }
  if (help.capturedAt !== undefined && typeof help.capturedAt !== 'string') {
    throw new Error('capturedAt must be a string when present');
  }
  if (help.sourcePath !== undefined && typeof help.sourcePath !== 'string') {
    throw new Error('sourcePath must be a string when present');
  }
  if (!Array.isArray(help.groups) || help.groups.length === 0) {
    throw new Error('groups must be a non-empty array');
  }

  help.groups.forEach((group, groupIndex) => {
    assertNonEmptyString(group?.name_zh, `groups[${groupIndex}].name_zh`);
    if (group.source !== 'inferred' && group.source !== 'explicit') {
      throw new Error(`groups[${groupIndex}].source must be inferred or explicit`);
    }
    if (!Array.isArray(group.flags)) {
      throw new Error(`groups[${groupIndex}].flags must be an array`);
    }
    group.flags.forEach((flag, flagIndex) => {
      assertNonEmptyString(flag?.name, `groups[${groupIndex}].flags[${flagIndex}].name`);
      if (flag.args !== undefined && typeof flag.args !== 'string') {
        throw new Error(`groups[${groupIndex}].flags[${flagIndex}].args must be a string when present`);
      }
      assertNonEmptyString(flag.desc_zh, `groups[${groupIndex}].flags[${flagIndex}].desc_zh`);
      assertNonEmptyString(flag.raw, `groups[${groupIndex}].flags[${flagIndex}].raw`);
    });
  });
}


export async function digestCommandFile(file, { llm = callAnthropic } = {}) {
  const brand = path.basename(file, '.cmd');
  const helpText = await fs.readFile(file, 'utf8');
  const prompt = buildDigestPrompt({ brand, helpText });
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const text = await llm(prompt, { max_tokens: 4096 });
      const command = parseJsonOutput(text);
      if (command.brand !== brand) {
        throw new Error(`brand mismatch: expected ${brand}, got ${command.brand}`);
      }
      validateCliCommand(command);
      return command;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}


export async function digestSubcommandHelpFile(file, { brand, llm = callAnthropic } = {}) {
  const resolvedBrand = brand ?? path.basename(path.dirname(file));
  const subcommand = path.basename(file, '.cmd');
  const helpText = await fs.readFile(file, 'utf8');
  const prompt = buildSubcommandHelpDigestPrompt({ brand: resolvedBrand, subcommand, helpText });
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const text = await llm(prompt, { max_tokens: 4096 });
      const help = parseJsonOutput(text);
      if (help.brand !== resolvedBrand) {
        throw new Error(`brand mismatch: expected ${resolvedBrand}, got ${help.brand}`);
      }
      if (help.subcommand !== subcommand) {
        throw new Error(`subcommand mismatch: expected ${subcommand}, got ${help.subcommand}`);
      }
      validateCliSubcommandHelp(help);
      return help;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function digestSubcommandHelpFiles({
  sourceDir = DEFAULT_SUBCOMMAND_HELP_SOURCE_DIR,
  outputDir = DEFAULT_SUBCOMMAND_HELP_OUTPUT_DIR,
  llm = callAnthropic,
  writeOutput = true,
} = {}) {
  let brandEntries;
  try {
    brandEntries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { helpsByBrand: new Map(), failures: [] };
    }
    throw error;
  }

  const helpsByBrand = new Map();
  const failures = [];

  for (const entry of brandEntries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const brand = entry.name;
    const brandDir = path.join(sourceDir, brand);
    const files = (await fs.readdir(brandDir))
      .filter((name) => name.endsWith('.cmd'))
      .sort()
      .map((name) => path.join(brandDir, name));
    const helps = [];

    for (const file of files) {
      const subcommand = path.basename(file, '.cmd');
      try {
        const help = await digestSubcommandHelpFile(file, { brand, llm });
        helps.push(help);
        console.log(`[digest-commands] ${brand} ${subcommand}: help ok`);
      } catch (error) {
        failures.push({ brand, subcommand, error });
        console.error(`[digest-commands] ${brand} ${subcommand}: help skipped after retry - ${error.message}`);
      }
    }

    helpsByBrand.set(brand, helps);
    if (writeOutput) {
      await fs.mkdir(outputDir, { recursive: true });
      const outputFile = path.join(outputDir, `${brand}.json`);
      await fs.writeFile(outputFile, `${JSON.stringify(helps, null, 2)}\n`);
      console.log(`[digest-commands] wrote ${helps.length} ${brand} subcommand helps to ${path.relative(ROOT, outputFile)}`);
    }
  }

  return { helpsByBrand, failures };
}


export async function digestCommands({
  sourceDir = DEFAULT_SOURCE_DIR,
  outputFile = DEFAULT_OUTPUT_FILE,
  llm = callAnthropic,
  writeOutput = true,
} = {}) {
  const entries = await fs.readdir(sourceDir);
  const files = entries
    .filter((name) => name.endsWith('.cmd'))
    .sort()
    .map((name) => path.join(sourceDir, name));

  const commands = [];
  const failures = [];

  for (const file of files) {
    const brand = path.basename(file, '.cmd');
    try {
      const command = await digestCommandFile(file, { llm });
      commands.push(command);
      console.log(`[digest-commands] ${brand}: ok`);
    } catch (error) {
      failures.push({ brand, error });
      console.error(`[digest-commands] ${brand}: skipped after retry - ${error.message}`);
    }
  }

  if (writeOutput) {
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, `${JSON.stringify(commands, null, 2)}\n`);
    console.log(`[digest-commands] wrote ${commands.length} commands to ${path.relative(ROOT, outputFile)}`);
  }

  return { commands, failures };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[digest-commands] ANTHROPIC_API_KEY not set. 本脚本需要本地密钥生成 commands.json。');
    process.exitCode = 1;
    return;
  }

  const { commands, failures } = await digestCommands();
  const { failures: helpFailures } = await digestSubcommandHelpFiles();
  if (commands.length === 0 || failures.length > 0 || helpFailures.length > 0) {
    process.exitCode = failures.length > 0 || helpFailures.length > 0 ? 1 : 0;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[digest-commands] fatal: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
