// directory-skill adapter — scan SKILL.md files from custom directories.
//
// This adapter scans user-specified directories (via directorySkillPaths in
// sources.yaml) for SKILL.md files. Each matched file is parsed as a skill
// and tagged with tier='directory' and dirName={parent directory name}.
//
// Usage:
//   import { scanDirectorySkills } from './adapters/directory-skill.mjs';
//   const result = await scanDirectorySkills({
//     paths: ['~/Project/SkillsHelper/packages/skills', '~/Work/custom-skills'],
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
  deriveDescription,
  makePreview,
  sha1Id,
} from '../utils.mjs';

/**
 * Scan custom directory paths for SKILL.md files.
 *
 * @param {object} opts
 * @param {string[]} opts.paths - base dirs to scan (with ~ expansion)
 * @param {string[]} [opts.globs] - optional glob patterns (default: glob matching SKILL.md)
 * @param {object} [opts.limits] - { maxFiles, maxFileBytes }
 * @returns {Promise}
 */
export async function scanDirectorySkills(opts) {
  const {
    paths = [],
    globs = ['**/SKILL.md'],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  if (!paths || !paths.length) {
    return { items: [], stats: { source: 'directory', available: false, files: 0 } };
  }

  const expanded = await expandRoots(paths);
  if (!expanded.length) {
    return { items: [], stats: { source: 'directory', available: false, files: 0 } };
  }

  // Collect file paths from all directories and globs
  const files = [];
  for (const root of expanded) {
    for (const globPattern of globs) {
      const found = await fg(globPattern, {
        cwd: root,
        absolute: true,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: true,
        deep: 10,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      });

      for (const f of found) {
        // Avoid duplicates
        if (!files.some(file => file.abs === f)) {
          files.push({ abs: f, root });
        }
        if (files.length >= limits.maxFiles) break;
      }
      if (files.length >= limits.maxFiles) break;
    }
    if (files.length >= limits.maxFiles) break;
  }

  // Parse each SKILL.md file
  const items = files.map(({ abs, root }) =>
    parseDirectorySkill({ abs, root, limits })
  );

  return {
    items,
    stats: {
      source: 'directory',
      available: true,
      files: items.length,
      roots: expanded,
    },
  };
}

/**
 * Parse a single SKILL.md file from a custom directory.
 */
function parseDirectorySkill({ abs, root, limits }) {
  const { text, truncated, mtime, error } = readFileSafe(abs, limits.maxFileBytes);
  const id = sha1Id(abs);
  const rel = path.relative(root, abs);

  // Directory name: the parent directory of SKILL.md
  // e.g. ~/Project/skills/auth-flow/SKILL.md → dirName = 'auth-flow'
  const dirName = path.basename(path.dirname(abs));

  // Category from path: if the structure is /root/category/skill-name/SKILL.md,
  // extract category from the first level above root.
  const relDir = path.dirname(rel);
  const category = relDir && relDir !== '.' ? relDir.split('/')[0] : undefined;

  if (error) {
    return baseDirectoryItem({
      abs,
      id,
      dirName,
      category,
      mtime,
      raw: '',
      parseError: error,
    });
  }

  if (truncated) {
    return baseDirectoryItem({
      abs,
      id,
      dirName,
      category,
      mtime,
      raw: '',
      parseError: `file > ${limits.maxFileBytes} bytes, skipped`,
    });
  }

  const { data: fm, body, parseError } = parseFrontmatter(text);

  const name = (fm.name || dirName).toString().trim();
  const title = (fm.title || fm.name || dirName).toString().trim();
  const description = deriveDescription(fm, body);

  const triggers = collectTriggers(fm);
  const tags = collectTags(fm);
  const links = collectLinks(fm);

  const item = {
    id,
    kind: 'skill',
    source: 'directory',
    editor: 'Custom Skills',
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
    // Tier 2: Directory-based skills
    tier: 'directory',
    dirName,
  };

  // Brand inference from content
  item.brand = inferBrand({
    name: item.name,
    description: item.description,
    category: item.category,
    raw: body,
  });

  if (parseError) item.parseError = parseError;
  return item;
}

function baseDirectoryItem({ abs, id, dirName, category, mtime, raw, parseError }) {
  return {
    id,
    kind: 'skill',
    source: 'directory',
    editor: 'Custom Skills',
    name: dirName,
    description: undefined,
    category,
    paths: {
      abs,
      rootKind: classifyRoot(abs),
    },
    preview: '',
    raw,
    updatedAt: new Date(mtime).toISOString(),
    tier: 'directory',
    dirName,
    parseError,
  };
}

function collectTriggers(fm) {
  const out = [];
  const candidates = [fm.triggers, fm.aliases, fm.when_to_use];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      out.push(...c.filter(x => typeof x === 'string').map(x => x.trim()));
    } else if (typeof c === 'string') {
      out.push(c.trim());
    }
  }
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
