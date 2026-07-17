// MCP config adapter — reads local config files and exposes MCP servers as safe IR.
// Values that may contain credentials are redacted before entering `raw`.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  classifyRoot,
  expandTilde,
  makePreview,
  readFileSafe,
  sha1Id,
} from '../utils.mjs';

const SECRET_KEY_RE = /(token|key|secret|password|passwd|credential|authorization|auth|cookie)/i;

export async function scanMcpConfigs(opts) {
  const {
    source = 'mcp-config',
    editor = 'MCP',
    files = [],
    limits = { maxFiles: 5000, maxFileBytes: 1024 * 1024 },
  } = opts;

  const items = [];
  for (const f of files || []) {
    const abs = path.resolve(expandTilde(f));
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    items.push(...parseConfigFile({ abs, source, editor, limits }));
    if (items.length >= limits.maxFiles) break;
  }
  return { items, stats: { source, available: true, files: items.length } };
}

function parseConfigFile({ abs, source, editor, limits }) {
  const { text, truncated, mtime, error } = readFileSafe(abs, limits.maxFileBytes);
  const rootKind = classifyRoot(abs);
  const fileName = path.basename(abs);
  const brand = inferBrandFromPath(abs);
  if (error || truncated) {
    return [baseItem({ abs, source, editor, brand, name: fileName, description: error || 'file too large', raw: '', mtime, rootKind })];
  }

  const parsed = parseAny(abs, text);
  if (!parsed.ok) {
    return [baseItem({ abs, source, editor, brand, name: fileName, description: `MCP/config file: ${fileName}`, raw: redactText(text), mtime, rootKind, parseError: parsed.error })];
  }

  const servers = extractMcpServers(parsed.value);
  if (!servers.length) {
    return [baseItem({ abs, source, editor, brand, name: fileName, description: `Config file: ${fileName}`, raw: safeStringify(parsed.value), mtime, rootKind })];
  }

  return servers.map(([serverName, cfg]) => {
    const safeCfg = redact(cfg);
    const command = typeof cfg?.command === 'string' ? cfg.command : undefined;
    const url = typeof cfg?.url === 'string' ? redactText(cfg.url) : undefined;
    const description = command
      ? `MCP server · command: ${command}`
      : url
        ? `MCP server · url: ${url}`
        : 'MCP server';
    const item = {
      id: sha1Id(`${abs}#${serverName}`),
      kind: 'mcp',
      source,
      editor,
      name: serverName,
      description,
      category: 'mcp',
      product: serverName,
      tags: ['mcp'],
      paths: { abs, rel: fileName, rootKind },
      preview: makePreview(safeStringify(safeCfg), 600),
      raw: safeStringify({ [serverName]: safeCfg }),
      updatedAt: new Date(mtime).toISOString(),
    };
    if (brand) {
      item.brand = brand;
      item.editorBrand = brand;
    }
    return item;
  });
}

function inferBrandFromPath(abs) {
  const normalized = abs.toLowerCase();
  if (normalized.includes('/.codex/') || normalized.includes('codex')) return 'codex';
  if (normalized.includes('/.claude/') || normalized.includes('claude_desktop') || normalized.includes('/claude')) return 'claude';
  if (normalized.includes('/.hermes/') || normalized.includes('/hermes/')) return 'hermes';
  if (normalized.includes('/.cursor/') || normalized.includes('cursor')) return 'cursor';
  return undefined;
}

function baseItem({ abs, source, editor, brand, name, description, raw, mtime, rootKind, parseError }) {
  const item = {
    id: sha1Id(abs),
    kind: 'config',
    source,
    editor,
    name,
    description,
    category: 'config',
    product: name,
    paths: { abs, rel: path.basename(abs), rootKind },
    preview: makePreview(raw, 600),
    raw,
    updatedAt: new Date(mtime).toISOString(),
  };
  if (brand) {
    item.brand = brand;
    item.editorBrand = brand;
  }
  if (parseError) item.parseError = parseError;
  return item;
}

function parseAny(abs, text) {
  try {
    if (/\.json$/i.test(abs)) return { ok: true, value: JSON.parse(text) };
    if (/\.ya?ml$/i.test(abs)) return { ok: true, value: YAML.parse(text) || {} };
    if (/\.toml$/i.test(abs)) return { ok: true, value: parseTomlMcpSubset(text) };
    return { ok: true, value: YAML.parse(text) || {} };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function extractMcpServers(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const candidate = obj.mcpServers || obj.mcp_servers || obj.servers || obj.mcp?.servers;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return [];
  return Object.entries(candidate);
}

function parseTomlMcpSubset(text) {
  const out = { mcp_servers: {} };
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sec = line.match(/^\[mcp_servers\.([^\]]+)\]$/);
    if (sec) {
      current = sec[1].replace(/^['"]|['"]$/g, '');
      out.mcp_servers[current] = {};
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    out.mcp_servers[current][key] = parseTomlValue(kv[2]);
  }
  return out;
}

function parseTomlValue(v) {
  const s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  if (s.startsWith('[') && s.endsWith(']')) {
    return s.slice(1, -1).split(',').map(x => parseTomlValue(x.trim())).filter(x => x !== '');
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

function redact(value, key = '') {
  if (SECRET_KEY_RE.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map(v => redact(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = redact(v, k);
    return out;
  }
  if (typeof value === 'string') return redactText(value);
  return value;
}

function redactText(text) {
  return String(text || '')
    .replace(/(sk-[A-Za-z0-9_-]{12,})/g, '[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}/gi, '$1[REDACTED]')
    .replace(/([?&](?:token|key|secret|password|auth)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/((?:TOKEN|KEY|SECRET|PASSWORD|AUTH)[A-Z0-9_]*\s*[=:]\s*)[^\s"']+/g, '$1[REDACTED]');
}

function safeStringify(obj) {
  return JSON.stringify(redact(obj), null, 2);
}
