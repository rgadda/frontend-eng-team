#!/usr/bin/env bash
# ft-bootstrap.sh — install the frontend-team pipeline scaffolding into a target repo.
#
# The plugin (subagents + skills) can be enabled globally via ~/.claude/settings.json —
# see scripts/global-settings.example.json for the snippet. But the pipeline itself
# (role definitions, slash commands, memory helper) has to live inside each repo so
# the slash commands can find .agents/roles/*.md at repo-relative paths.
#
# This script does that per-repo setup in one command. Idempotent — safe to re-run
# after the team repo updates its role contracts.
#
# Usage:
#   cd /path/to/some-frontend-project
#   ft-bootstrap                 # uses the default team repo location
#   FT_TEAM_REPO=/custom/path ft-bootstrap
#
# Recommended install:
#   ln -s /path/to/frontend-eng-team/scripts/ft-bootstrap.sh ~/bin/ft-bootstrap
#   (make sure ~/bin is on your PATH)

set -euo pipefail

# --- resolve the team repo (source of role definitions + slash commands) --------

# Default: assume ft-bootstrap.sh is symlinked and the team repo is the script's
# grandparent directory. Override with FT_TEAM_REPO env var.
if [ -n "${FT_TEAM_REPO:-}" ]; then
  TEAM_REPO="$FT_TEAM_REPO"
else
  # Resolve the real path of this script (following symlinks), then walk up two levels.
  SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || python3 -c "import os,sys; print(os.path.realpath(sys.argv[1]))" "$0")"
  TEAM_REPO="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
fi

if [ ! -d "$TEAM_REPO/.agents/roles" ]; then
  echo "ft-bootstrap: cannot find frontend-team repo at $TEAM_REPO" >&2
  echo "  Set FT_TEAM_REPO=/path/to/frontend-eng-team and re-run." >&2
  exit 2
fi

# --- sanity checks on the target repo -------------------------------------------

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ft-bootstrap: current directory is not inside a git repo." >&2
  echo "  cd into your project's git root and re-run." >&2
  exit 2
fi

TARGET_ROOT="$(git rev-parse --show-toplevel)"
cd "$TARGET_ROOT"

if [ "$TARGET_ROOT" = "$TEAM_REPO" ]; then
  echo "ft-bootstrap: refusing to bootstrap the frontend-team repo into itself." >&2
  exit 2
fi

echo "ft-bootstrap:"
echo "  source: $TEAM_REPO"
echo "  target: $TARGET_ROOT"
echo

# --- copy pipeline scaffolding (idempotent) -------------------------------------

# .agents/ — canonical role contracts + memory helper.
# Overwrite roles + pipeline.md so team updates propagate; DO NOT clobber
# per-developer memory files (append.sh is idempotent to copy, .jsonl are gitignored
# and personal).
mkdir -p .agents/roles .agents/memory
cp "$TEAM_REPO/.agents/pipeline.md" .agents/pipeline.md
cp "$TEAM_REPO/.agents/README.md"   .agents/README.md
cp "$TEAM_REPO/.agents/roles/"*.md  .agents/roles/
cp "$TEAM_REPO/.agents/memory/schema.md" .agents/memory/schema.md
cp "$TEAM_REPO/.agents/memory/append.sh" .agents/memory/append.sh
chmod +x .agents/memory/append.sh

# .claude/commands/ — slash command entry points.
mkdir -p .claude/commands
cp "$TEAM_REPO/.claude/commands/"*.md .claude/commands/

# AGENTS.md — cross-tool router (Copilot, other AI tools land here).
# Skip if the target already has an AGENTS.md the user has customized —
# print a diff hint instead of clobbering.
if [ -f AGENTS.md ] && ! cmp -s AGENTS.md "$TEAM_REPO/AGENTS.md"; then
  echo "  AGENTS.md: EXISTS and differs — leaving it alone."
  echo "    diff with team version: diff AGENTS.md $TEAM_REPO/AGENTS.md"
else
  cp "$TEAM_REPO/AGENTS.md" AGENTS.md
  echo "  AGENTS.md: installed"
fi

# --- .gitignore — append transient artifacts if not already there ---------------

touch .gitignore
add_ignore() {
  local line=$1
  if ! grep -qxF "$line" .gitignore; then
    printf '%s\n' "$line" >> .gitignore
    echo "  .gitignore: added '$line'"
  fi
}

add_ignore 'branch-plan.md'
add_ignore 'branch-prd.md'
add_ignore '.agents/memory/*.jsonl'

# --- .claude/settings.local.json — allowlist the memory helper so JSONL appends -
# don't trigger a permission prompt each phase. Only patch if the file is small
# enough to parse safely; otherwise print the snippet for manual merge.

SETTINGS_FILE=".claude/settings.local.json"
mkdir -p .claude
if [ ! -f "$SETTINGS_FILE" ]; then
  cat > "$SETTINGS_FILE" <<'EOF'
{
  "permissions": {
    "allow": [
      "Bash(.agents/memory/append.sh:*)",
      "Bash(grep:*.agents/memory/*)"
    ]
  }
}
EOF
  echo "  $SETTINGS_FILE: created with memory-helper allowlist"
else
  if ! grep -q '.agents/memory/append.sh' "$SETTINGS_FILE"; then
    echo "  $SETTINGS_FILE: already exists — add these to permissions.allow manually:"
    echo '      "Bash(.agents/memory/append.sh:*)"'
    echo '      "Bash(grep:*.agents/memory/*)"'
  fi
fi

# --- done -----------------------------------------------------------------------

echo
echo "ft-bootstrap: done."
echo
echo "Next steps:"
echo "  1. Verify plugin is enabled (globally via ~/.claude/settings.json):"
echo "       /plugin list"
echo "     Should show frontend-team as enabled."
echo
echo "  2. Try the pipeline in this repo:"
echo "       /pipeline <your first task>"
echo
echo "  3. When the team repo updates roles, re-run ft-bootstrap from this repo"
echo "     to pull in the new contracts. Your local .agents/memory/*.jsonl is"
echo "     preserved."
echo
echo "For the full setup story (including the one-time global plugin install),"
echo "see: $TEAM_REPO/scripts/setup-global.md"
