// Shared scanner utilities — every adapter MUST use these for consistency.
//
// parseFrontmatter   YAML frontmatter at top of markdown, tolerant
// sha1Id             stable id from absolute path
// expandRoots        glob-aware path resolution (~ / *)
// inferBrand         keyword-match brand from text
// inferProduct       extract product from skill name / category
// classifyRoot       'home' | 'project' | 'icloud'
// readFileSafe       size-guarded read

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import YAML from 'yaml';
import fg from 'fast-glob';

// ─────────────────────────────── path / fs ────────────────────────────────

export function expandTilde(p) {
  if (!p) return p;
  if (p === '~' || p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

/**
 * Expand a list of roots (may contain ~ and glob *) into actual existing dirs.
 * Non-existing paths are silently dropped — callers report "unavailable" via
 * stat checks separately.
 */
export async function expandRoots(roots) {
  if (!roots || !roots.length) return [];
  const out = new Set();
  for (const r of roots) {
    const expanded = expandTilde(r);
    if (expanded.includes('*')) {
      const matches = await fg(expanded, { onlyDirectories: true, absolute: true });
      matches.forEach(m => out.add(m));
    } else {
      const abs = path.resolve(expanded);
      if (fs.existsSync(abs)) out.add(abs);
    }
  }
  return [...out];
}

export function classifyRoot(absPath) {
  if (absPath.includes('/Library/Mobile Documents/')) return 'icloud';
  if (absPath.startsWith(os.homedir() + '/Project/')) return 'project';
  if (absPath.startsWith(os.homedir())) return 'home';
  return 'project';
}

export function readFileSafe(abs, maxBytes = 1024 * 1024) {
  try {
    const stat = fs.statSync(abs);
    if (stat.size > maxBytes) {
      return { text: '', truncated: true, size: stat.size, mtime: stat.mtime };
    }
    return {
      text: fs.readFileSync(abs, 'utf8'),
      truncated: false,
      size: stat.size,
      mtime: stat.mtime,
    };
  } catch (e) {
    return { text: '', error: e.message, size: 0, mtime: new Date(0) };
  }
}

// ─────────────────────────────── id / hash ────────────────────────────────

export function sha1Id(absPath) {
  return crypto.createHash('sha1').update(absPath).digest('hex').slice(0, 16);
}

// ─────────────────────────────── frontmatter ──────────────────────────────

const FM_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

/**
 * Parse YAML frontmatter at the very top of a markdown file.
 * Returns { data, body, i18n?, parseError? }. `data` is always an object (possibly
 * empty). Body never has the frontmatter block.
 */
export function parseFrontmatter(text) {
  if (!text || !text.startsWith('---')) {
    return { data: {}, body: text || '' };
  }
  const m = text.match(FM_RE);
  if (!m) {
    return { data: {}, body: text };
  }
  const [, yamlBlock, body] = m;
  try {
    const data = YAML.parse(yamlBlock) || {};

    // Extract i18n fields if present
    const i18n = {};
    for (const key of ['name_zh', 'description_zh', 'category_zh']) {
      if (data[key]) i18n[key] = data[key];
    }

    return {
      data: typeof data === 'object' && !Array.isArray(data) ? data : {},
      body: body || '',
      ...(Object.keys(i18n).length > 0 && { i18n }),
    };
  } catch (e) {
    return { data: {}, body: body || text, parseError: `frontmatter: ${e.message}` };
  }
}

// ─────────────────────────────── inference ────────────────────────────────

const BRAND_KEYWORDS = [
  // tooling
  ['Hermes', /\bhermes\b/i],
  ['Claude Code', /\bclaude[\s-]?code\b/i],
  ['Anthropic', /\b(anthropic|claude)\b/i],
  ['OpenAI', /\b(openai|chatgpt|gpt-?[0-9]|codex)\b/i],
  ['Cursor', /\bcursor\b/i],
  ['GitHub', /\b(github|\bgh\b|octokit)\b/i],
  ['Cloudflare', /\b(cloudflare|cf-|workers|wrangler|r2|d1)\b/i],
  ['Google', /\b(gemini|google\s|gws)\b/i],
  ['Apple', /\b(apple|imessage|appleнотes|findmy|macos)\b/i],
  ['Notion', /\bnotion\b/i],
  ['Linear', /\blinear\b/i],
  ['Obsidian', /\bobsidian\b/i],
  ['Modal', /\bmodal\b/i],
  ['HuggingFace', /\b(huggingface|hf-cli|hf\s+hub)\b/i],
  ['Discord', /\bdiscord\b/i],
  ['Telegram', /\btelegram\b/i],
  ['X', /\b(twitter|x\.com|x-cli|xurl)\b/i],
  ['Vercel', /\bvercel\b/i],
  ['Docker', /\bdocker\b/i],
  ['Kubernetes', /\b(kubernetes|kubectl|k8s)\b/i],
  ['NVIDIA', /\b(cuda|nvidia)\b/i],
  ['Suno', /\bsuno\b/i],
  ['Spotify', /\bspotify\b/i],
];

export function inferBrand({ name, description, category, raw }) {
  const hay = [name, description, category].filter(Boolean).join(' ');
  const head = (raw || '').slice(0, 800);
  const text = `${hay} ${head}`;
  for (const [brand, re] of BRAND_KEYWORDS) {
    if (re.test(text)) return brand;
  }
  return undefined;
}

/**
 * Infer "product" — typically the skill name itself for product-shaped skills
 * (e.g. "new-api-deployment" → "new-api"), or the bare name otherwise.
 */
export function inferProduct({ name, category }) {
  if (!name) return undefined;
  // Strip common suffixes that aren't product names
  const cleaned = name
    .replace(/-deployment$/, '')
    .replace(/-workflow$/, '')
    .replace(/-bot-notifications$/, '')
    .replace(/-management$/, '');
  return cleaned;
}

// ─────────────────────────────── markdown ─────────────────────────────────

/**
 * Extract a one-line description: prefer frontmatter.description, else first
 * non-empty paragraph (no headings, no blank).
 */
export function deriveDescription(fmData, body) {
  if (fmData?.description && typeof fmData.description === 'string') {
    return fmData.description.trim();
  }
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    if (t.startsWith('---')) continue;
    return t.slice(0, 240);
  }
  return undefined;
}

export function makePreview(body, maxChars = 600) {
  const trimmed = (body || '').trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars).trimEnd() + '…';
}
