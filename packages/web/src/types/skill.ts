/**
 * SkillItem — Unified skill data structure from backend scanner
 * 
 * This IR (Intermediate Representation) is returned by all adapters:
 * - Tier 1: Official tools (hermes, claude-code, cursor, codex, hermes-plugin)
 * - Tier 2: Custom directory skills (directory-skill)
 * - Tier 3: Other sources (project-runbook, etc.)
 *
 * Imported from packages/scanner/src/types.d.ts (backend definition)
 * This frontend copy ensures type safety without backend dependency
 */

export type SkillKind = 'skill' | 'plugin' | 'mcp' | 'runbook' | 'doc';

export type PluginCapabilityKind = 'skill' | 'mcp' | 'app' | 'interactive' | 'write';

export interface PluginCapability {
  kind: PluginCapabilityKind;
  label: string;
  count?: number;
}

export interface PluginMetadata {
  manifestPath: string;
  version?: string;
  author?: string;
  homepage?: string;
  category?: string;
  capabilities: PluginCapability[];
  defaultPrompts?: string[];
  logoPath?: string;
}

export type SkillSource =
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

/**
 * Tier categorization — Phase 1 Backend redesign
 * Controls UI display, filtering, and icon selection
 */
export type SkillTier = 'tool' | 'directory' | 'other';

export interface SkillItem {
  /** sha1(absPath) — stable across runs, used as React key */
  id: string;

  /** Broad category — drives icon and filtering */
  kind: SkillKind;

  /** Source adapter that produced this item */
  source: SkillSource;

  /** Machine-readable name (from SKILL.md frontmatter or directory) */
  name: string;

  /** Human-readable title for display */
  title: string;

  /** Brief description (one line) */
  description?: string;

  /**
   * NEW (Phase 1): Tier categorization
   * - 'tool': Official tools (hermes, claude-code, etc.) with brand
   * - 'directory': Custom skills from specified directories
   * - 'other': Other sources (project-runbook, etc.)
   */
  tier?: SkillTier;

  /**
   * NEW (Phase 1): Brand identifier for Tier 1 tools
   * Maps to emoji icon: 'hermes' → ⚡, 'claude' → 🤖, etc.
   * Only set on Tier 1 items
   */
  brand?: string;

  /**
   * NEW (Phase 1): Parent directory name (Tier 2 only)
   * Used as secondary label for directory-based skills
   * Example: 'auth-flow' from ~/custom-skills/auth-flow/SKILL.md
   */
  dirName?: string;

  /** Semantic category from scanner; legacy UI data may provide multiple tags. */
  category?: string | string[];

  /** Which tool/editor owns this skill (e.g., 'Hermes', 'Custom Skills') */
  editor?: string;

  /** Product or brand name (e.g., 'Claude', 'Cursor') */
  product?: string;

  /** Trigger phrases for activation */
  triggers?: string[];

  /** Semantic tags for search */
  tags?: string[];

  /** File paths associated with this skill */
  paths?: string[];

  /** Preview markdown (first N lines of SKILL.md body) */
  preview?: string;

  /** Full raw content (SKILL.md body or rendered doc) */
  raw?: string;

  /** Related links (e.g., documentation URLs) */
  links?: Array<{
    text: string;
    href: string;
  }>;

  /** ISO 8601 timestamp of last modification */
  updatedAt?: string;

  /** Parse error if skill metadata was malformed */
  parseError?: string;

  /**
   * i18n translation metadata (optional)
   * Populated by the backend unless SKILLHELPER_TRANSLATE=0
   */
  i18n?: {
    zh?: {
      title?: string;
      description?: string;
    };
    translatedAt?: string;
    translationModel?: string;
  };

  translation?: {
    name: 'ready' | 'pending' | 'failed' | 'idle';
    description: 'ready' | 'pending' | 'failed' | 'idle';
  };

  plugin?: PluginMetadata;
}

/**
 * API Response Shape
 */
export interface SkillsApiResponse {
  items: SkillItem[];
  stats: {
    total: number;
    bySource: Record<SkillSource, number>;
    byTier?: Record<SkillTier, number>;
    parseErrors: number;
    updatedAt: string;
  };
}
