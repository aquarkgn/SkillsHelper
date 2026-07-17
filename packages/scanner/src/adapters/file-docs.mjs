// Generic Markdown file adapter for Codex AGENTS.md, Cursor rules, and project runbooks.

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import {
  classifyRoot,
  deriveDescription,
  expandRoots,
  expandTilde,
  inferBrand,
  inferProduct,
  makePreview,
  parseFrontmatter,
  readFileSafe,
  sha1Id,
} from '../utils.mjs';

export async function scanFileDocs(opts) {
  const {
    source,
    editor,
    kind = 'doc',
    files = [],
    roots = [],
    globs = [],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const discovered = [];
  for (const f of files || []) {
    const abs = path.resolve(expandTilde(f));
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) discovered.push({ abs, root: path.dirname(abs) });
  }

  const expandedRoots = await expandRoots(roots || []);
  const patterns = globs?.length ? globs : [];
  for (const root of expandedRoots) {
    for (const pattern of patterns) {
      const found = await fg(pattern, {
        cwd: root,
        absolute: true,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: false,
        deep: 8,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.venv/**', '**/vendor_imports/**'],
      });
      for (const abs of found) {
        discovered.push({ abs, root });
        if (discovered.length >= limits.maxFiles) break;
      }
      if (discovered.length >= limits.maxFiles) break;
    }
    if (discovered.length >= limits.maxFiles) break;
  }

  const byAbs = new Map();
  for (const x of discovered) if (!byAbs.has(x.abs)) byAbs.set(x.abs, x);
  const items = [...byAbs.values()].map(x => parseDoc({ ...x, source, editor, kind, limits }));
  return { items, stats: { source, available: true, files: items.length, roots: expandedRoots } };
}

function parseDoc({ abs, root, source, editor, kind, limits }) {
  const { text, truncated, mtime, error } = readFileSafe(abs, limits.maxFileBytes);
  const rel = path.relative(root, abs);
  const id = sha1Id(abs);
  const base = path.basename(abs);
  const project = inferProjectName(abs, root);
  const name = inferName(abs, base, project);
  const category = inferCategory(abs, root, base);

  if (error || truncated) {
    return {
      id,
      kind,
      source,
      editor,
      name,
      description: error || `file > ${limits.maxFileBytes} bytes, skipped`,
      category,
      product: project || inferProduct({ name, category }),
      paths: { abs, rel, rootKind: classifyRoot(abs) },
      preview: '',
      raw: '',
      updatedAt: new Date(mtime).toISOString(),
      parseError: error || 'file too large',
    };
  }

  const { data: fm, body, parseError } = parseFrontmatter(text);
  const title = (fm.title || fm.name || name).toString().trim();
  const description = deriveDescription(fm, body);
  const item = {
    id,
    kind,
    source,
    editor,
    name: title,
    description,
    category,
    product: project || inferProduct({ name: title, category }),
    tags: collectTags(fm),
    triggers: collectTriggers(fm),
    paths: { abs, rel, rootKind: classifyRoot(abs) },
    preview: makePreview(body || text),
    raw: text,
    updatedAt: new Date(mtime).toISOString(),
  };
  item.brand = inferBrand({ name: item.name, description: item.description, category: item.category, raw: body });
  if (!item.tags?.length) delete item.tags;
  if (!item.triggers?.length) delete item.triggers;
  if (parseError) item.parseError = parseError;
  return item;
}

function inferProjectName(abs, root) {
  const homeProject = `${process.env.HOME}/Project/`;
  if (abs.startsWith(homeProject)) return abs.slice(homeProject.length).split('/')[0];
  const parts = root.split('/').filter(Boolean);
  return parts.at(-1);
}

function inferName(abs, base, project) {
  if (base === 'AGENTS.md') return `${project || 'project'} / AGENTS.md`;
  if (base === 'CLAUDE.md') return `${project || 'project'} / CLAUDE.md`;
  if (base === '.cursorrules') return `${project || 'project'} / .cursorrules`;
  if (base.startsWith('RUNBOOK-')) return base.replace(/\.md$/i, '');
  return base.replace(/\.mdc?$/i, '');
}

function inferCategory(abs, root, base) {
  if (base === 'AGENTS.md') return 'codex';
  if (base === 'CLAUDE.md') return 'claude-code';
  if (base === '.cursorrules' || abs.includes('/.cursor/rules/')) return 'cursor';
  if (base.startsWith('RUNBOOK-')) return 'runbook';
  const relDir = path.dirname(path.relative(root, abs));
  if (!relDir || relDir === '.') return 'project';
  return relDir.split('/')[0];
}

function collectTags(fm) {
  const v = fm.tags;
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function collectTriggers(fm) {
  const out = [];
  for (const v of [fm.triggers, fm.aliases, fm.when_to_use]) {
    if (!v) continue;
    if (Array.isArray(v)) out.push(...v.filter(x => typeof x === 'string').map(x => x.trim()));
    else if (typeof v === 'string') out.push(v.trim());
  }
  return [...new Set(out)];
}
