// Tauri 开发期的 Node 桥接入口。
// 它直接复用 SkillHelper 的扫描与翻译模块，不启动 Fastify，也不暴露 HTTP 端口。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanTier1EditorSkills } from '../packages/scanner/src/adapters/tier1-editor-skills.mjs';
import { scanClaudeAgents } from '../packages/scanner/src/adapters/claude-agents.mjs';
import { scanClaudePlugins } from '../packages/scanner/src/adapters/claude-plugin.mjs';
import { scanMcpConfigs } from '../packages/scanner/src/adapters/mcp-config.mjs';
import { translateText } from '../packages/server/src/translation-text.mjs';

const home = os.homedir();
const limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 };

function findExecutable(name) {
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // PATH 中不存在的目录不是错误。
    }
  }
  return null;
}

function catalogueItem(item, kind = item.kind) {
  return {
    id: item.id,
    app: 'claude',
    kind,
    name: item.name,
    description: item.description || '',
    path: item.paths?.abs || '',
    source: item.source || 'claude',
    status: item.parseError ? 'needs_attention' : 'discovered',
  };
}

function claudeOnly(item) {
  return item.brand === 'claude' || item.editorBrand === 'claude' || /claude/i.test(item.editor || '');
}

async function scanCatalog() {
  const issues = [];
  const items = [];

  try {
    const tier = await scanTier1EditorSkills({ projectRoot: process.cwd(), limits });
    items.push(...tier.items.filter(claudeOnly).map((item) => catalogueItem(item, 'skill')));
  } catch (error) {
    issues.push(`Claude 技能扫描失败：${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const agents = await scanClaudeAgents({ roots: [path.join(home, '.claude', 'agents')], limits });
    items.push(...agents.items.map((item) => catalogueItem(item, 'plugin')));
  } catch (error) {
    issues.push(`Claude Agent 扫描失败：${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const plugins = await scanClaudePlugins({ roots: [path.join(home, '.claude', 'plugins', 'cache')], limits });
    items.push(...plugins.items.map((item) => catalogueItem(item, 'plugin')));
  } catch (error) {
    issues.push(`Claude 插件扫描失败：${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const mcp = await scanMcpConfigs({
      source: 'claude-mcp',
      editor: 'Claude',
      files: [path.join(home, '.claude.json'), path.join(home, '.claude', 'mcp.json')],
      limits,
    });
    items.push(...mcp.items.filter(claudeOnly).map((item) => catalogueItem(item, 'mcp')));
  } catch (error) {
    issues.push(`Claude MCP 扫描失败：${error instanceof Error ? error.message : String(error)}`);
  }

  const claudeCli = findExecutable('claude');
  if (claudeCli) {
    items.push({
      id: `claude:cli:${claudeCli}`,
      app: 'claude',
      kind: 'cli',
      name: 'claude',
      description: '已在 PATH 中发现 Claude CLI；未执行命令。',
      path: claudeCli,
      source: 'path',
      status: 'available',
    });
  }

  const chatgptDir = path.join(home, 'Library', 'Application Support', 'com.openai.chat');
  if (fs.existsSync(chatgptDir)) {
    items.push({
      id: 'chatgpt:desktop',
      app: 'chatgpt',
      kind: 'app',
      name: 'ChatGPT Desktop',
      description: '已发现桌面端本地目录；Skills、MCP、插件与 CLI 格式待适配器确认。',
      path: chatgptDir,
      source: 'chatgpt-desktop',
      status: 'pending_format',
    });
  } else {
    issues.push('未发现 ChatGPT Desktop 数据目录');
  }

  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  unique.sort((left, right) => left.kind.localeCompare(right.kind) || left.name.localeCompare(right.name));
  return { items: unique, issues };
}

async function main() {
  const request = JSON.parse(process.argv[2] || '{}');
  if (request.operation === 'scan') return scanCatalog();
  if (request.operation === 'translate') {
    if (typeof request.text !== 'string') throw new Error('翻译文本必须是字符串');
    if (request.text.length > 6000) throw new Error('单次翻译文本不能超过 6000 个字符');
    return translateText(request.text, 'zh-CN');
  }
  throw new Error('未知的桌面核心操作');
}

main()
  .then((result) => process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`))
  .catch((error) => {
    process.stdout.write(`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  });
