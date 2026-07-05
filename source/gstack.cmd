~/Project/HuHaa-MySkills (main ✗) gstack -h
gstack — installer for Garry Tan's gstack skill pack

Usage:
  npx @garrytan/gstack                   interactive wizard
  npx @garrytan/gstack <command> [opts]

Commands:
  install        Install gstack globally (~/.claude/skills/gstack)
  init           Add gstack to the current project (team mode)
  uninstall      Remove gstack (global; add --project for just this repo)
  upgrade        Pull latest gstack and rebuild
  doctor         Diagnose install issues
  status         Show install version, hosts, and settings
  list           List available skills
  enable <name>  Enable a skill in the current project
  disable <name> Disable a skill in the current project

Common options:
  --host <id>    Register with host (repeatable, comma-separated).
                 Valid: claude, codex, factory, opencode, kiro
  --prefix       Use gstack-* skill names
  --no-prefix    Use flat skill names (default)
  --no-claude-md Don't write gstack section to CLAUDE.md
  --yes, -y      Skip confirmation prompts
  --reinstall    Remove existing install before installing
  --quiet, -q    Suppress non-essential output
  --tier <t>     init only: "required" or "optional" (default: required)
  --no-commit    init only: stage but don't commit changes
  --project      uninstall only: remove from current project, not global
  --keep-claude-md  uninstall only: leave CLAUDE.md section in place

Examples:
  npx @garrytan/gstack install --host claude,codex
  npx @garrytan/gstack init --tier optional
  npx @garrytan/gstack uninstall --project --yes
  npx @garrytan/gstack doctor