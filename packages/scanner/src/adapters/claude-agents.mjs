// Claude Code sub-agents adapter — scans ~/.claude/agents/*.md and ./.claude/agents/*.md
// Claude Code stores subagent definitions as Markdown with YAML frontmatter
// (fields: name, description, tools, model). See claude code docs.

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import YAML from 'yaml';
import {
  classifyRoot,
  deriveDescription,
  expandRoots,
  makePreview,
  readFileSafe,
  sha1Id,
} from '../utils.mjs';

const AGENT_GLOBS = ['**/agents/**/*.md', '**/agents/*.md'];
const IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**'];
const MAX_DEPTH = 4;

export async function scanClaudeAgents(opts) {
  const {
    source = 'claude-agents',
    editor = 'Claude Code',
    roots = [],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const expanded = await expandRoots(roots || []);
  const files = new Set();
  for (const root of expanded) {
    if (!fs.existsSync(root)) continue;
    const found = await fg(AGENT_GLOBS, {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      dot: true,
      followSymbolicLinks: false,
      deep: MAX_DEPTH,
      ignore: IGNORE,
    });
    for (const f of found) files.add(f);
  }

  const items = [];
  for (const abs of files) {
    items.push(parseAgentFile({ abs, source, editor, limits }));
    if (items.length >= limits.maxFiles) break;
  }
  return { items, stats: { source, available: true, files: items.length, roots: expanded } };
}

function parseAgentFile({ abs, source, editor, limits }) {
  const rel = path.basename(abs, path.extname(abs));
  const id = sha1Id(abs);
  const read = readFileSafe(abs, limits.maxFileBytes);
  const rootKind = classifyRoot(abs);

  if (read.error || read.truncated) {
    const item = {
      id,
      kind: 'skill',
      source,
      editor,
      name: rel,
      title: rel,
      description: read.error || `agent file > ${limits.maxFileBytes} bytes, skipped`,
      paths: { abs, rel, rootKind },
      preview: '',
      raw: '',
      updatedAt: new Date(read.mtime || 0).toISOString(),
    };
    item.brand = 'claude';
    item.editorBrand = 'claude';
    if (read.error) item.parseError = read.error;
    return item;
  }

  let frontmatter = {};
  let body = read.text;
  let parseError = undefined;
  if (body.startsWith('---\n')) {
    const endIdx = body.indexOf('\n---\n', 4);
    if (endIdx > 0) {
      try {
        frontmatter = YAML.parse(body.slice(4, endIdx)) || {};
      } catch (e) {
        parseError = `Frontmatter parse error: ${e.message}`;
      }
      body = body.slice(endIdx + 5);
    }
  }

  const name = String(frontmatter.name || rel).trim();
  const description = typeof frontmatter.description === 'string'
    ? frontmatter.description.trim()
    : deriveDescription(frontmatter, body);

  const tools = Array.isArray(frontmatter.tools)
    ? frontmatter.tools.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const model = typeof frontmatter.model === 'string' ? frontmatter.model.trim() : undefined;

  const rawHeader = [
    `# ${name}`,
    description ? `\n${description}` : '',
    tools.length ? `\n\n## 工具 / tools\n\n${tools.map((t) => `- ${t}`).join('\n')}` : '',
    model ? `\n\n## 模型 / model\n\n\`${model}\`` : '',
    body ? `\n\n## 系统提示\n\n${body.trim()}` : '',
  ].join('');

  const item = {
    id,
    kind: 'skill',
    source,
    editor,
    name,
    title: name,
    description,
    paths: { abs, rel, rootKind },
    preview: makePreview(body || description, 600),
    raw: rawHeader,
    tags: ['agent', 'subagent', ...(tools.length ? ['tools'] : [])],
    links: typeof frontmatter.homepage === 'string'
      ? [{ label: 'homepage', url: frontmatter.homepage }]
      : undefined,
    updatedAt: new Date(read.mtime || 0).toISOString(),
  };
  item.brand = 'claude';
  item.editorBrand = 'claude';
  if (parseError) item.parseError = parseError;
  return item;
}