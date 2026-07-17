// skill-adapter.mjs — adapter for scanning generic SKILL.md files from other sources
// Unlike markdown-skill.mjs which targets specific tools (hermes, claude-code),
// this adapter provides a generic way to scan SKILL.md files from any source
// and returns a standardized format with frontmatter parsing.

import path from 'node:path';
import fsp from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fg from 'fast-glob';
import {
  expandRoots,
  classifyRoot,
  parseFrontmatter,
  inferBrand,
  inferProduct,
  deriveDescription,
  makePreview,
  sha1Id,
} from '../utils.mjs';

const execFileP = promisify(execFile);

/** Default concurrency for file reads — bounded by CPU count (R7.2). */
const DEFAULT_CONCURRENCY = Math.max(4, Math.min(16, (os.cpus()?.length || 4)));

/**
 * Run an async mapper over items with a bounded concurrency pool.
 * Keeps the event loop responsive and caps open file handles during scans.
 * @template T,R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(concurrency, items.length || 1)).fill(0).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Scan SKILL.md files from arbitrary locations/sources
 * @param {object} opts
 * @param {string} opts.source              — IR source tag (e.g., 'other-skills', 'custom-skills')
 * @param {string[]} opts.roots              — base dirs to scan (with ~ / globs)
 * @param {string} [opts.fileGlob='SKILL.md'] — relative glob pattern
 * @param {object} [opts.limits]             — { maxFiles, maxFileBytes }
 * @param {'mini'|'full'} [opts.stage='full'] — 'mini' skips heavy fields for fast first paint (R7.1)
 * @param {number} [opts.concurrency]        — parallel file reads (R7.2)
 * @param {boolean} [opts.useSpotlight=false] — use `mdls` for timestamps (R7.3)
 * @returns {Promise<{items:SkillItem[], stats:object}>}
 */
export async function scanSkills(opts) {
  const {
    source = 'other-skills',
    roots = [],
    fileGlob = '**/SKILL.md',
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
    stage = 'full',
    concurrency = DEFAULT_CONCURRENCY,
    useSpotlight = false,
  } = opts;

  const startedAt = Date.now();
  const expanded = await expandRoots(roots);
  if (!expanded.length) {
    return { items: [], stats: { source, available: false, files: 0, stage } };
  }

  // Collect file paths
  const files = [];
  for (const root of expanded) {
    const found = await fg(fileGlob, {
      cwd: root,
      absolute: true,
      onlyFiles: true,
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

  // Optional Spotlight timestamps (R7.3) — batched, best-effort.
  const spotlightDates = useSpotlight ? await fetchSpotlightDates(files.map(f => f.abs)) : null;

  // Parse each file concurrently (R7.2)
  const items = await mapWithConcurrency(files, concurrency, ({ abs, root }) =>
    parseSkillFile({ abs, root, source, limits, stage, spotlightDates }),
  );

  // Stable ordering by path (R3) — concurrency must not change output order.
  items.sort((a, b) => (a.paths?.abs || '').localeCompare(b.paths?.abs || ''));

  return {
    items,
    stats: {
      source,
      available: true,
      files: items.length,
      roots: expanded,
      stage,
      duration: Date.now() - startedAt,
    },
  };
}

/**
 * Best-effort batched Spotlight timestamps via `mdls` (R7.3, opt-in).
 * Returns a Map<abs, {creationDate?, contentChangeDate?}> or null on failure.
 * @param {string[]} paths
 * @returns {Promise<Map<string, {creationDate?: string, contentChangeDate?: string}>|null>}
 */
async function fetchSpotlightDates(paths) {
  if (process.platform !== 'darwin' || !paths.length) return null;
  const map = new Map();
  const CHUNK = 50;
  try {
    for (let i = 0; i < paths.length; i += CHUNK) {
      const chunk = paths.slice(i, i + CHUNK);
      const { stdout } = await execFileP('mdls', [
        '-name', 'kMDItemFSCreationDate',
        '-name', 'kMDItemFSContentChangeDate',
        '-raw',
        ...chunk,
      ]);
      // -raw emits values separated by NUL, in order: [creation, change] per file.
      const values = stdout.split('\0');
      for (let j = 0; j < chunk.length; j++) {
        const creation = values[j * 2];
        const change = values[j * 2 + 1];
        const entry = {};
        if (creation && creation !== '(null)') entry.creationDate = toIso(creation);
        if (change && change !== '(null)') entry.contentChangeDate = toIso(change);
        if (entry.creationDate || entry.contentChangeDate) map.set(chunk[j], entry);
      }
    }
    return map;
  } catch {
    return null;
  }
}

function toIso(mdlsDate) {
  // mdls raw date looks like "2026-07-01 10:30:00 +0000"
  const d = new Date(mdlsDate.replace(' +', '+').replace(/ (\d{4})$/, ' +$1'));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Read a file safely with async I/O + byte limit (R7.2).
 * @returns {Promise<{text:string, truncated:boolean, mtime:Date, error?:string}>}
 */
async function readFileSafeAsync(abs, maxBytes) {
  try {
    const stat = await fsp.stat(abs);
    if (stat.size > maxBytes) {
      return { text: '', truncated: true, mtime: stat.mtime };
    }
    return { text: await fsp.readFile(abs, 'utf8'), truncated: false, mtime: stat.mtime };
  } catch (e) {
    return { text: '', truncated: false, mtime: new Date(0), error: e.message };
  }
}

/**
 * Parse a single SKILL.md file
 * @param {object} opts
 * @param {string} opts.abs     — absolute path to the SKILL.md file
 * @param {string} opts.root    — root directory for relative path calculation
 * @param {string} opts.source  — source identifier
 * @param {object} opts.limits  — { maxFileBytes }
 * @param {'mini'|'full'} opts.stage — 'mini' skips heavy fields (R7.1)
 * @param {Map|null} opts.spotlightDates — optional Spotlight timestamps (R7.3)
 * @returns {Promise<SkillItem>}
 */
async function parseSkillFile({ abs, root, source, limits, stage = 'full', spotlightDates = null }) {
  const { text, truncated, mtime, error } = await readFileSafeAsync(abs, limits.maxFileBytes);
  const id = sha1Id(abs);
  const rel = path.relative(root, abs);

  // Extract category from directory structure
  const relDir = path.dirname(rel);
  const category = relDir && relDir !== '.' ? relDir.split('/')[0] : undefined;

  // Extract skill name from parent directory
  const dirName = path.basename(path.dirname(abs));

  const updatedAt =
    spotlightDates?.get(abs)?.contentChangeDate || new Date(mtime).toISOString();

  // Handle file read errors
  if (error) {
    return createBaseItem({ abs, id, source, dirName, category, updatedAt, raw: '', parseError: error });
  }

  // Handle truncated files
  if (truncated) {
    return createBaseItem({
      abs,
      id,
      source,
      dirName,
      category,
      updatedAt,
      raw: '',
      parseError: `file > ${limits.maxFileBytes} bytes, skipped`,
    });
  }

  // Parse frontmatter
  const { data: fm, body, i18n, parseError } = parseFrontmatter(text);

  const name = (fm.name || dirName).toString().trim();
  const title = (fm.title || fm.name || dirName).toString().trim();
  const description = deriveDescription(fm, body);

  // Explicit icon override from frontmatter (e.g. "emoji:🤖", "url:...", "app:bundleId")
  const icon = typeof fm.icon === 'string' ? fm.icon.trim() : undefined;

  // Build the item — 'mini' stage omits heavy fields for a fast first paint (R7.1).
  const item = {
    id,
    kind: 'skill',
    source,
    editor: 'Other Skills',
    name,
    title: title !== name ? title : undefined,
    description,
    category,
    icon,
    paths: {
      abs,
      rel,
      rootKind: classifyRoot(abs),
    },
    updatedAt,
  };

  // Infer brand (needed by both stages for icon resolution)
  item.brand = inferBrand({ name, description, category, raw: stage === 'mini' ? description : body });

  if (stage !== 'mini') {
    const triggers = collectTriggers(fm);
    const tags = collectTags(fm);
    const links = collectLinks(fm);
    item.triggers = triggers.length ? triggers : undefined;
    item.tags = tags.length ? tags : undefined;
    item.preview = makePreview(body);
    item.raw = text;
    item.links = links.length ? links : undefined;
    item.product = inferProduct({ name, category });

    if (i18n) {
      item.i18n = {
        ...i18n,
        translatedAt: new Date().toISOString(),
        translationModel: 'frontmatter',
      };
    }
  }

  if (parseError) item.parseError = parseError;
  return item;
}

/**
 * Create a minimal skill item for error cases
 */
function createBaseItem({ abs, id, source, dirName, category, updatedAt, raw, parseError }) {
  return {
    id,
    kind: 'skill',
    source,
    editor: 'Other Skills',
    name: dirName,
    description: undefined,
    category,
    paths: { abs, rootKind: classifyRoot(abs) },
    preview: '',
    raw,
    updatedAt,
    parseError,
  };
}

/**
 * Collect trigger strings from frontmatter
 */
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

/**
 * Collect tags from frontmatter
 */
function collectTags(fm) {
  const v = fm.tags;
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

/**
 * Collect links from frontmatter
 */
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
