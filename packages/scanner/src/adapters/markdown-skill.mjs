// markdown-skill adapter — shared logic for any source whose items are
// SKILL.md files with YAML frontmatter (Hermes, Claude Code, gstack, …).
//
// Usage:
//   import { scanMarkdownSkills } from './adapters/markdown-skill.mjs';
//   const items = await scanMarkdownSkills({
//     source: 'hermes',
//     roots: ['~/.hermes/skills'],
//     fileGlob: 'SKILL.md',
//     limits,
//   });

import path from 'node:path';
import fg from 'fast-glob';
import {
  expandRoots,
  classifyRoot,
  readFileSafe,
  parseFrontmatter,
  inferBrand,
  inferProduct,
  deriveDescription,
  makePreview,
  sha1Id,
} from '../utils.mjs';

/**
 * @param {object} opts
 * @param {string} opts.source                — IR source tag
 * @param {string[]} opts.roots               — base dirs (with ~ / globs)
 * @param {string} [opts.fileGlob='SKILL.md'] — relative glob from each root
 * @param {object} [opts.limits]              — { maxFiles, maxFileBytes }
 * @returns {Promise<{items:import('../types').SkillItem[], stats:object}>}
 */
export async function scanMarkdownSkills(opts) {
  const {
    source,
    roots,
    fileGlob = '**/SKILL.md',
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const expanded = await expandRoots(roots);
  if (!expanded.length) {
    return { items: [], stats: { source, available: false, files: 0 } };
  }

  // collect file paths first
  const files = [];
  for (const root of expanded) {
    const found = await fg(fileGlob, {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      // gstack and similar plugins stash skills under hidden dirs like
      // `.agents/skills/...`, `.cursor/skills/...`. Default dot:false dropped
      // ~80% of claude-code skills. We let dotfiles in but still nuke noise
      // dirs (`.git`, `node_modules`, `dist`) via the ignore list.
      dot: true,
      followSymbolicLinks: true,
      deep: 10,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    });
    for (const f of found) {
      files.push({ abs: f, root });
      if (files.length >= limits.maxFiles) break;
    }
    if (files.length >= limits.maxFiles) break;
  }

  // parse each
  const items = files.map(({ abs, root }) => parseSkillFile({ abs, root, source, limits }));
  return {
    items,
    stats: { source, available: true, files: items.length, roots: expanded },
  };
}

function parseSkillFile({ abs, root, source, limits }) {
  const { text, truncated, mtime, error } = readFileSafe(abs, limits.maxFileBytes);
  const id = sha1Id(abs);
  const rel = path.relative(root, abs);

  // category from the directory chain between root and the file
  // e.g. ~/.hermes/skills/devops/new-api-deployment/SKILL.md
  //      → relDir = "devops/new-api-deployment"
  //      → category = "devops"
  const relDir = path.dirname(rel);
  const category = relDir && relDir !== '.' ? relDir.split('/')[0] : undefined;

  // The skill's machine-name is the parent directory (Hermes / Claude Code
  // convention is one SKILL.md per dir).
  const dirName = path.basename(path.dirname(abs));

  if (error) {
    return baseItem({ abs, id, source, dirName, category, mtime, raw: '', parseError: error });
  }
  if (truncated) {
    return baseItem({
      abs, id, source, dirName, category, mtime, raw: '',
      parseError: `file > ${limits.maxFileBytes} bytes, skipped`,
    });
  }

  const { data: fm, body, i18n, parseError } = parseFrontmatter(text);

  const name = (fm.name || dirName).toString().trim();
  const title = (fm.title || fm.name || dirName).toString().trim();
  const description = deriveDescription(fm, body);

  // triggers — accept several field names used in the wild
  const triggers = collectTriggers(fm);

  // tags — accept array or comma-separated string
  const tags = collectTags(fm);

  // links — fm.links: [{label, url}] or fm.url: string
  const links = collectLinks(fm);

  const product = inferProduct({ name, category });
  const item = {
    id,
    kind: 'skill',
    source,
    editor: editorForSource(source),
    name,
    title: title !== name ? title : undefined,
    description,
    category,
    triggers: triggers.length ? triggers : undefined,
    tags: tags.length ? tags : undefined,
    paths: {
      abs,
      rel,
      rootKind: classifyRoot(abs),
    },
    preview: makePreview(body),
    raw: text,
    links: links.length ? links : undefined,
    updatedAt: new Date(mtime).toISOString(),
    product,
  };

  // Include i18n translations if present
  if (i18n) {
    item.i18n = {
      ...i18n,
      translatedAt: new Date().toISOString(),
      translationModel: 'frontmatter',
    };
  }

  item.brand = inferBrand({
    name: item.name,
    description: item.description,
    category: item.category,
    raw: body,
  });
  if (parseError) item.parseError = parseError;
  return item;
}

function baseItem({ abs, id, source, dirName, category, mtime, raw, parseError }) {
  return {
    id,
    kind: 'skill',
    source,
    editor: editorForSource(source),
    name: dirName,
    description: undefined,
    category,
    paths: { abs, rootKind: classifyRoot(abs) },
    preview: '',
    raw,
    updatedAt: new Date(mtime).toISOString(),
    parseError,
  };
}

function editorForSource(source) {
  const map = {
    hermes: 'Hermes Agent',
    'claude-code': 'Claude Code',
    codex: 'Codex',
    cursor: 'Cursor',
    'mcp-config': 'MCP',
    project: 'Project Docs',
  };
  return map[source] || source;
}

function collectTriggers(fm) {
  const out = [];
  const candidates = [fm.triggers, fm.aliases, fm.when_to_use];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      out.push(...c.filter(x => typeof x === 'string').map(x => x.trim()));
    } else if (typeof c === 'string') {
      // when_to_use is usually a long sentence — keep it as a single trigger
      out.push(c.trim());
    }
  }
  // dedup, preserve order
  return [...new Set(out)];
}

function collectTags(fm) {
  const v = fm.tags;
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function collectLinks(fm) {
  const out = [];
  if (Array.isArray(fm.links)) {
    for (const l of fm.links) {
      if (l && typeof l === 'object' && l.url) {
        out.push({ label: l.label || l.url, url: l.url });
      }
    }
  }
  if (typeof fm.url === 'string') {
    out.push({ label: 'docs', url: fm.url });
  }
  return out;
}
