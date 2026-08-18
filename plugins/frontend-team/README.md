# frontend-team plugin

Versioned distribution of the frontend team's Claude Code subagents and skills.
Replaces hand-copied `~/.claude/agents/` files with a one-command install pinned
to a version.

## What ships

### Skills (run in the main context — cheapest, no child fork)

| Skill | Triggers | Purpose |
|---|---|---|
| `component-conventions` | "new component", "create hook", "refactor component", "modify feature" | React 18 + TS5 + CSS Modules + Axios + Jest/RTL playbook |
| `pr-prep` | "open PR", "ready to ship", "before I push", "PR description" | Diff hygiene, non-negotiables sweep, gates, description template |
| `pm-clarify` | "clarify", "what does the PRD say", "is this in scope", "PM question", "/pm-clarify" | Answers dev/tester questions from `branch-prd.md`; escalates a copy-paste-ready question to the human PM only when the PRD does not cover it |
| `loop-engineering` | "add self-critique", "add RCC loop", "iterate the plan", "critique its own output" | Reference for the Refine-Critique-Converge (RCC) pattern used by every role |

### Subagents (forked context, return summaries — keeps main transcript lean)

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| `repo-explorer` | haiku | Read, Grep, Glob | Locate files/symbols, map a feature, find convention examples |
| `frontend-reviewer` | sonnet | Read, Grep, Glob | Diff review against CLAUDE.md — CRITICAL/RECOMMENDED/OPTIONAL, now includes baked-in Security + SRE basics |
| `test-runner` | sonnet | Read, Grep, Glob, Bash | Run Jest + Playwright, return summarized failures (not raw logs) |
| `prod-readiness` | haiku | Read, Grep, Glob | On-demand Security + SRE deep pass. Fires **only** when the plan carries a `sensitive:*` tag. Returns 10-item checklist + PASS/CONCERNS/BLOCK verdict |
| `verifier` | sonnet | Read, Grep, Glob, Bash | Final gate — `tsc`/`eslint`/`vite build` + **25-item** PASS/FAIL checklist (adds 5 Security+SRE gates on top of the original 20) |

### Why this split

- **Skills** run in the main context with no child fork. Convention reminders,
  PRD Q&A, and pattern documentation that the orchestrator loads on demand —
  cheapest possible delivery, and they share the active conversation's context.
- **Subagents** are isolated, read-heavy roles. They fork off the main session,
  return a concise summary, and keep raw file dumps / test logs out of the main
  transcript. Cache hit rate stays high.
- **Architect, Implementer, PM** stay as main-session slash commands
  (`/architect`, `/implement`, `/pm`) — they need CLAUDE.md inheritance and
  produce work you review interactively. Making them subagents would strip
  CLAUDE.md (subagents do not inherit it) and force a summary you do not want
  for plans, PRDs, or production code.

### On-demand agents (cost discipline)

Two agents fire only when a specific condition is met, to avoid unnecessary
spawns:

- **`prod-readiness`** fires only when the Architect tagged the plan with a
  `sensitive:*` tag (`sensitive:security`, `sensitive:auth`, `sensitive:pii`,
  `sensitive:payments`, `sensitive:network`, `sensitive:reliability`). For
  normal changes, the baked-in Security + SRE basics in `frontend-reviewer` and
  the 5 new gates in `verifier` cover the risk.
- **PM (`/pm`)** — main-session, not a subagent, but subject to the same skip
  discipline: it is invoked only for feature work. Bug fixes, refactors,
  chores, and docs skip PM and go straight to `/architect`.

### Subagent contract

Every subagent in this plugin **inlines** the CLAUDE.md conventions it needs
into its own system prompt. Subagents do not inherit CLAUDE.md or skills — if
a subagent must use a skill, it is declared in the `skills:` frontmatter
field. Each `description` carries explicit trigger keywords so the
orchestrator routes correctly and the cached prefix stays lean.

## Versioning

- Plugin version is declared in `plugins/frontend-team/.claude-plugin/plugin.json`.
- Bump the version on every change. Pin distributions with a git ref or SHA so
  teams upgrade deliberately.
- Current: **0.2.0** — adds `prod-readiness` subagent, `pm-clarify` skill,
  `loop-engineering` skill, and 5 Security+SRE gates in the verifier
  (20 → 25 items).

## Install

From any repo where you want the agents available:

```bash
# 1. Register the marketplace (once per machine, or commit to repo-level settings.json)
/plugin marketplace add <owner>/<repo>

# 2. Install the plugin
/plugin install frontend-team@frontend-team-marketplace
```

To pin a version: `/plugin install frontend-team@frontend-team-marketplace@0.2.0`.

This repo's `.claude/settings.json` declares the marketplace + enables the
plugin, so cloning this repo auto-loads it without manual install.

## Verify

```text
/agents     # repo-explorer, frontend-reviewer, test-runner, prod-readiness, verifier listed
/context    # confirm token budget healthy
```

Watch the Claude Code cache hit rate after a few sessions — if it drops, check
that subagent `description` fields are stable (changing them invalidates the
cached prefix).

## Updating

1. Edit agent/skill files.
2. Bump `version` in `plugins/frontend-team/.claude-plugin/plugin.json` AND in
   the matching entry in `.claude-plugin/marketplace.json`.
3. Commit and tag.
4. Teams pull and re-run
   `/plugin install frontend-team@frontend-team-marketplace@<new-version>`.

## Roles deliberately NOT in this plugin

- `/pm`, `/architect`, `/implement`, `/pipeline`, `/review`, `/verify` slash
  commands remain in `.claude/commands/` and delegate to `.agents/roles/*.md`.
  They are main-session orchestration entry points. Moving them into the
  plugin is a future option but would change the existing approval-gated
  workflow.
- **Critic** role — deliberately deferred to keep agent count low. The RCC
  self-critique loops in each phase cover in-context iteration. A dedicated
  Critic subagent would be reconsidered if RCC proves insufficient on
  real work.
