# frontend-team plugin

Versioned distribution of the frontend team's Claude Code subagents and skills. Replaces hand-copied `~/.claude/agents/` files with a one-command install pinned to a version.

## What ships

### Skills (run in the main context — cheapest, no child fork)

| Skill | Triggers | Purpose |
|---|---|---|
| `component-conventions` | "new component", "create hook", "refactor component", "modify feature" | React 18 + TS5 + CSS Modules + Axios + Jest/RTL playbook |
| `pr-prep` | "open PR", "ready to ship", "before I push", "PR description" | Diff hygiene, non-negotiables sweep, gates, description template |

### Subagents (forked context, return summaries — keeps main transcript lean)

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| `repo-explorer` | haiku | Read, Grep, Glob | Locate files/symbols, map a feature, find convention examples |
| `frontend-reviewer` | sonnet | Read, Grep, Glob | Diff review against CLAUDE.md — CRITICAL/RECOMMENDED/OPTIONAL |
| `test-runner` | sonnet | Read, Grep, Glob, Bash | Run Jest + Playwright, return summarized failures (not raw logs) |
| `verifier` | sonnet | Read, Grep, Glob, Bash | Final gate — `tsc`/`eslint`/`vite build` + 20-item PASS/FAIL checklist |

### Why this split

- **Skills** run in the main context with no child fork. They are convention reminders that the orchestrator loads on demand — cheapest possible delivery, and they share the active conversation's context.
- **Subagents** are isolated, read-heavy roles. They fork off the main session, return a concise summary, and keep raw file dumps / test logs out of the main transcript. Cache hit rate stays high.
- **Architect** and **Implementer** stay as main-session slash commands (`/architect`, `/implement`) — they need CLAUDE.md inheritance and produce work you review interactively. Making them subagents would strip CLAUDE.md (subagents do not inherit it) and force a summary you do not want for plans or production code.

### Subagent contract

Every subagent in this plugin **inlines** the CLAUDE.md conventions it needs into its own system prompt. Subagents do not inherit CLAUDE.md or skills — if a subagent must use a skill, it is declared in the `skills:` frontmatter field. Each `description` carries explicit trigger keywords so the orchestrator routes correctly and the cached prefix stays lean.

## Versioning

- Plugin version is declared in `plugins/frontend-team/.claude-plugin/plugin.json`.
- Bump the version on every change. Pin distributions with a git ref or SHA so teams upgrade deliberately.

## Install

From any repo where you want the agents available:

```bash
# 1. Register the marketplace (once per machine, or commit to repo-level settings.json)
/plugin marketplace add <owner>/<repo>

# 2. Install the plugin
/plugin install frontend-team@frontend-team-marketplace
```

To pin a version: `/plugin install frontend-team@frontend-team-marketplace@0.1.0`.

This repo's `.claude/settings.json` declares the marketplace + enables the plugin, so cloning this repo auto-loads it without manual install.

## Verify

```text
/agents     # repo-explorer, frontend-reviewer, test-runner, verifier listed
/context    # confirm token budget healthy
```

Watch the Claude Code cache hit rate after a few sessions — if it drops, check that subagent `description` fields are stable (changing them invalidates the cached prefix).

## Updating

1. Edit agent/skill files.
2. Bump `version` in `plugins/frontend-team/.claude-plugin/plugin.json` AND in the matching entry in `.claude-plugin/marketplace.json`.
3. Commit and tag.
4. Teams pull and re-run `/plugin install frontend-team@frontend-team-marketplace@<new-version>`.

## Roles deliberately NOT in this plugin

- `/architect`, `/implement`, `/pipeline`, `/review`, `/verify` slash commands remain in `.claude/commands/` and delegate to `.agents/roles/*.md`. They are main-session orchestration entry points. Moving them into the plugin is a future option but would change the existing approval-gated workflow.
