// Unified IR (Intermediate Representation) — every adapter normalizes its
// source into this shape. The web UI only knows about SkillItem, never the
// raw source layout.
//
// Type definitions live here for IDE / future TS migration. Runtime is plain
// JS, no compile step needed.

export interface ParamSpec {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface SkillItem {
  /** sha1(absPath) — stable across runs, doubles as web-side key */
  id: string;

  /** broad type — drives icon + filtering */
  kind: 'skill' | 'plugin' | 'mcp' | 'runbook' | 'instruction' | 'config' | 'doc' | 'agent-rule';

  /** which adapter produced this item */
  source:
    | 'hermes'
    | 'claude-code'
    | 'codex'
    | 'cursor'
    | 'obsidian'
    | 'project'
    | 'project-runbook'
    | 'hermes-plugin'
    | 'directory'
    | 'mcp-config';

  /** machine name (frontmatter.name or file basename) */
  name: string;

  /** human-readable title — falls back to name */
  title?: string;

  /** one-line description — falls back to first paragraph */
  description?: string;

  /** category path, e.g. "devops", "mlops/inference" */
  category?: string;

  /** owning editor/tool surface, e.g. "Hermes Agent", "Claude Code", "Cursor" */
  editor?: string;

  /** brand inferred from description / path, e.g. "OpenAI", "Cloudflare" */
  brand?: string;

  /** product name extracted from skill, e.g. "new-api", "frp" */
  product?: string;

  /** trigger phrases (when_to_use / triggers / aliases) */
  triggers?: string[];

  /** MCP tool param schema — empty for skills */
  params?: ParamSpec[];

  /** free-form tags */
  tags?: string[];

  paths: {
    /** absolute path on disk — copy-button payload */
    abs: string;
    /** path relative to project root if applicable */
    rel?: string;
    /** classification of the root the file lives under */
    rootKind: 'home' | 'project' | 'icloud';
  };

  /** truncated markdown body for list-view preview */
  preview: string;

  /** complete file content — lazy-loaded by detail view via /api/skills/:id */
  raw: string;

  /** related links (docs URL, source repo) discovered in frontmatter */
  links?: { label: string; url: string }[];

  /** ISO timestamp — last modified time of the underlying file */
  updatedAt: string;

  /** present when frontmatter / format parse failed; UI shows red badge */
  parseError?: string;

  // NEW FIELDS for Skills Tab Redesign v0.3.3
  /** Tier 1/2/3 categorization — controls display logic and icon in UI */
  tier?: 'tool' | 'directory' | 'other';

  /** Parent directory name (Tier 2 only) — used for display label */
  dirName?: string;

  // NEW FIELDS for v4.0 Priority Scan & Path Dedup
  /** MD5(normalizedAbsPath) — used for deduplication and menu layering */
  pathHash?: string;

  /** v4.0 tier classification: tier-1 (editor tools), tier-2 (user), tier-3 (other) */
  tierId?: 'tier-1' | 'tier-2' | 'tier-3';

  /** v4.0 editor brand within Tier 1 (cursor, claude, hermes, etc.) */
  editorBrand?: string;

  /** 检测置信度（v0.4 对标 cockpit registry 化）：L1 只发现目录 / L2 命中技能文件 / L3 解析有效 / L4 完整元数据 */
  confidence?: 'L1' | 'L2' | 'L3' | 'L4';

  /** i18n translation metadata (if present) */
  i18n?: {
    zh?: {
      title?: string;
      description?: string;
    };
    translatedAt?: string;
    translationModel?: string;
  };
}
