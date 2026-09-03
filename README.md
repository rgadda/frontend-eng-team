# Frontend AI Pipeline — Setup Guide

This template wires a **six-role multi-agent pipeline** (PM → Architect →
Implementer → Reviewer → Prod-Readiness → Verifier) into a frontend codebase.
The role contracts live in `.agents/` and are tool-neutral, so the same
pipeline runs in Claude Code, GitHub Copilot, or any other AI tool that can
read project files.

Two of the six roles are conditional: **PM** is skipped for bug fixes,
refactors, chores, and docs; **Prod-Readiness** fires only when the plan
carries a `sensitive:*` tag. Every role runs a bounded Refine-Critique-Converge
inner loop, and every phase appends a JSONL summary to `.agents/memory/` so
downstream phases read a paragraph instead of re-parsing full artifacts.

For small, non-sensitive changes (≤200 LOC / ≤3 files), a **lite variant**
runs Implementer → Reviewer only via `/pipeline-lite` — skipping Architect
and Verifier for roughly 55% lower token cost. Two dedicated lite role files
(`implementer-lite.md` + `reviewer-lite.md`) hold the compressed contracts,
activated directly by `pipeline-lite.md`, so lite-mode sub-agents load only
the compact variant (not the full base contracts). A hard entry gate rejects
any task with sensitive keywords (auth, payments, PII, security) so lite mode
fails closed on the wrong tasks. See **[Usage patterns](#usage-patterns)** for the decision tree.

---

## Quick setup

- **Global (once per machine):** install the plugin globally via
  `claude plugin marketplace add` + `claude plugin install` — see
  [scripts/setup-global.md](scripts/setup-global.md) for exact commands.
- **Per repo (once each):** run `ft-bootstrap` from the repo root. This copies
  the pipeline scaffolding (role files, slash commands, memory helper) and
  wires up `.gitignore` + a permission allowlist.
- **Verify:** `/plugin list` shows `frontend-team`; `/agents` lists all five
  subagents; `/pipeline <task>` runs.

Full setup guide with troubleshooting: **[scripts/setup-global.md](scripts/setup-global.md)**.

---

## File Map

```
repo-root/
│
├── CLAUDE.md                          <- Auto-loaded by Claude Code on every session.
│                                         Project identity: stack, rules, constraints.
│
├── AGENTS.md                          <- Generic multi-tool entry point. Routes any AI
│                                         tool that follows the AGENTS.md convention into
│                                         the canonical role definitions in .agents/.
│
├── .agents/                           <- Canonical role definitions (source of truth).
│   ├── README.md                        Overview of how the roles are organized.
│   ├── pipeline.md                      Orchestrator: phases, approval gates, RCC, loop logic.
│   ├── pipeline-lite.md                 Lite orchestrator: Implementer → Reviewer only, hard sensitivity gate.
│   ├── roles/
│   │   ├── pm.md                        PM role — features only (skipped for bug/refactor/chore/docs)
│   │   ├── architect.md                 Architect role contract (with RCC self-critique loop)
│   │   ├── implementer.md               Implementer role contract (with RCC self-critique loop)
│   │   ├── implementer-lite.md          Implementer role — Lite Mode variant (used by /pipeline-lite)
│   │   ├── reviewer.md                  Reviewer role contract (with baked-in Security + SRE basics)
│   │   ├── reviewer-lite.md             Reviewer role — Lite Mode variant (used by /pipeline-lite)
│   │   ├── prod-readiness.md            Prod-Readiness role — conditional (sensitive:* plans only)
│   │   └── verifier.md                  Verifier role contract (10-bucket checklist)
│   └── memory/                          Persistent JSONL memory (per-developer, gitignored).
│       ├── schema.md                    Record shape + read/write patterns
│       └── append.sh                    Append helper called by every role at end-of-phase
│
├── .claude/
│   ├── commands/                      <- Claude Code slash-command entry points.
│   │   ├── pm.md                        /pm <task>         → reads .agents/roles/pm.md
│   │   ├── pm-clarify.md                /pm-clarify <q>    → invokes the pm-clarify skill
│   │   ├── architect.md                 /architect <task>  → reads .agents/roles/architect.md
│   │   ├── implement.md                 /implement         → reads .agents/roles/implementer.md
│   │   ├── review.md                    /review            → reads .agents/roles/reviewer.md
│   │   ├── verify.md                    /verify            → reads .agents/roles/verifier.md
│   │   ├── pipeline.md                  /pipeline <task>       → reads .agents/pipeline.md
│   │   └── pipeline-lite.md             /pipeline-lite <task>  → reads .agents/pipeline-lite.md (small non-sensitive changes)
│   └── settings.json                  <- Registers the local plugin marketplace +
│                                         auto-enables the frontend-team plugin.
│
├── .claude-plugin/
│   └── marketplace.json               <- Marketplace manifest (`frontend-team-marketplace`)
│                                         that publishes the bundled plugin.
│
├── plugins/
│   └── frontend-team/                 <- Versioned plugin: subagents + skills.
│       ├── .claude-plugin/plugin.json   Plugin manifest (name, version).
│       ├── agents/                      Subagents (forked-context helpers).
│       │   ├── repo-explorer.md           Cheap haiku lookups: "where is X"
│       │   ├── frontend-reviewer.md       Diff review, returns structured verdict
│       │   ├── test-runner.md             Runs Jest + Playwright, summarized output
│       │   ├── prod-readiness.md          On-demand Security + SRE deep pass (haiku)
│       │   └── verifier.md                Final tsc/eslint/build gate + 10-bucket checklist
│       └── skills/                      Skills (main-context convention reminders).
│           ├── component-conventions/     React/TS/CSS/Axios/test playbook
│           ├── pr-prep/                   Pre-push diff hygiene + gates
│           ├── pm-clarify/                Dev/tester PRD Q&A grounded in branch-prd.md
│           └── loop-engineering/          Reference for the RCC self-critique pattern
│
├── .github/
│   └── copilot-instructions.md        <- Copilot entry point. Auto-loaded by VS Code
│                                         Copilot Chat. Documents the paste-driven
│                                         workflow that maps to the .agents/ roles.
│
├── framework.md                       <- The multi-agent methodology document.
├── metrics-collection.md              <- What metrics to collect and how.
├── pr-tracking.md                     <- PR-level tracking templates.
│
└── scripts/
    ├── ft-bootstrap.sh                <- Per-repo installer for the pipeline scaffolding.
    ├── setup-global.md                <- Full global setup guide (plugin + bootstrap).
    ├── collect-pr-metrics.ts          <- Self-contained CLI for measuring PR velocity.
    └── README.md                      <- Portable usage guide for the metrics script.
```

---

## How to activate the agents

The role definitions are the same across every tool — only the activation mechanism changes.

### Claude Code (slash commands)

`CLAUDE.md` is auto-loaded at session start, so project rules apply to every conversation.
Slash commands in `.claude/commands/` become `/pm`, `/pm-clarify`, `/architect`,
`/implement`, `/review`, `/verify`, `/pipeline`, and `/pipeline-lite`. Each command
file imperatively reads its matching `.agents/roles/*.md` (or `.agents/pipeline.md`
/ `.agents/pipeline-lite.md` for the orchestrators) and follows it.

### GitHub Copilot in VS Code (paste-driven)

Copilot does not support user-defined slash commands like `/pipeline`. Instead:

- `.github/copilot-instructions.md` is auto-loaded into every Copilot Chat in this
  repo, so the four roles and pipeline phases are already in Copilot's context.
- To activate a single role, attach the role file with the `#file:` reference (e.g.
  `#file:.agents/roles/architect.md`) or paste its contents into the chat and tell
  Copilot to follow the contract.
- For the full pipeline, follow the phase-by-phase paste workflow documented in
  [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
- The `@workspace` agent and Copilot Edits / Agent mode work normally during Phase 2
  for multi-file changes.

### Subagents and skills (Claude Code plugin)

In addition to the slash commands, this repo ships a Claude Code **plugin** at
`plugins/frontend-team/` that publishes five subagents and four skills via the
`frontend-team-marketplace` defined in `.claude-plugin/marketplace.json`.

Cloning this repo and opening it in Claude Code is enough — `.claude/settings.json`
registers the marketplace and auto-enables the plugin. To use it from any other
repo, install the plugin **globally once**, then bootstrap the pipeline
scaffolding **per repo**:

```bash
# Once per machine:
claude plugin marketplace add <owner>/frontend-eng-team --scope user
claude plugin install frontend-team@frontend-team-marketplace --scope user

# Once per target repo:
cd /path/to/some-frontend-project
ft-bootstrap
```

Full walkthrough with troubleshooting: [scripts/setup-global.md](scripts/setup-global.md).

Verify with `/agents` (you should see `repo-explorer`, `frontend-reviewer`,
`test-runner`, `prod-readiness`, `verifier`).

See **Using subagents efficiently** below for when each one earns its keep.

### Other AI tools

Any AI tool that follows the `AGENTS.md` convention will land at the root [AGENTS.md](AGENTS.md),
which routes the tool into `.agents/roles/` and `.agents/pipeline.md`. The role
contracts are tool-neutral and contain everything an agent needs to play the role.

---

## Tech Stack

This template is configured for a frontend team using:

| Tool | Purpose |
|---|---|
| React 18 | UI framework (functional components only) |
| TypeScript 5 | Language (strict mode, no `any`) |
| Vite | Build tooling |
| CSS Modules | Component-scoped styling |
| Axios | HTTP client (centralized instance) |
| Jest + React Testing Library | Unit testing |
| Playwright | E2E testing |
| ESLint + Prettier | Linting and formatting |

---

## Usage patterns

The examples below use Claude Code slash commands. For the Copilot equivalent,
swap the slash command for the paste-driven workflow in `.github/copilot-instructions.md`.

### Full pipeline (recommended for new features)

```
/pipeline Add a UserProfile component to the settings feature
          that fetches user data via Axios and displays it
          with editable fields and form validation
```

The pipeline runs Phase 1 (Architect), **stops at the human approval gate**, and only
proceeds to Phases 2–4 (Implementer → Reviewer → Verifier) after you explicitly approve
the plan.

### Role by role (recommended when you want to inspect each phase)

```
# Step 1
/architect Add a UserProfile component to the settings feature

# Step 2 — uses Architect output from the same conversation
/implement

# Step 3
/review

# Step 4
/verify
```

### Lite pipeline (for small, non-sensitive changes)

```
/pipeline-lite Add a loading spinner to the SettingsPanel while user data is fetching
```

Runs Implementer → Reviewer only. Skips PM, Architect, Verifier, prod-readiness,
approval gates, and the outer FAIL loop. Target run cost: ≤25K tokens end-to-end
(vs. ~50–60K for the full pipeline).

**Hard entry gate:** the orchestrator refuses to run if the task text contains
sensitive keywords (auth, login, token, password, payment, PII, sanitiz,
webhook, cookie, etc.) or looks like a real feature. Reply `override` to
force lite mode anyway; recommended path is `/pipeline` for anything the
gate flags.

**Verdict handling:**
- Reviewer `APPROVE` → `LITE PIPELINE COMPLETE` with cost rollup.
- Reviewer `REQUEST CHANGES` → four-choice menu: `fix` (re-run Implementer-lite
  with the CRITICALs as new spec, cap 2 iterations), `escalate` (stop; re-run
  with `/pipeline <original task>` for full Verifier gate), `merge` (accept
  and merge anyway; logged as `lite:true,override:true`), `abort`.

### Full vs. lite — which one when

| Situation | Use |
|---|---|
| New feature with user-facing behavior | `/pipeline` |
| Sensitive change (auth, payments, PII, security, reliability) | `/pipeline` — always |
| Refactor touching multiple modules or a Context / hook / effect / portal | `/pipeline` |
| Change > 200 LOC or > 3 files | `/pipeline` |
| Small bugfix, config tweak, copy change, one-file typo | `/pipeline-lite` |
| CSS-only change, docs update | `/pipeline-lite` |
| Well-established pattern, low blast radius | `/pipeline-lite` |
| Throwaway spike or personal exploration | Neither — just `/implement` directly |

### Quick implementation (for one-file, one-step tasks)

```
/implement Fix the TypeScript error in src/features/settings/SettingsPanel.tsx
           line 47 — the onSelect prop is typed as any
```

### Copilot equivalent (paste-driven)

```
# Phase 1 — Architect
@workspace #file:.agents/roles/architect.md
Activate this role and follow its contract. Read CLAUDE.md for project constraints.
Plan the implementation for: <your task>

# Wait for the plan, then approve before proceeding.

# Phase 2 — Implementer
@workspace #file:.agents/roles/implementer.md
Activate this role. Execute this plan exactly: <paste Phase 1 output>

# (continue for Reviewer and Verifier — see .github/copilot-instructions.md)
```

---

## Using subagents efficiently

The slash commands (`/architect`, `/implement`) run in the **main session** because
they need `CLAUDE.md` inheritance and an interactive review surface. The subagents
in the plugin run in **forked contexts** — they spin up, do read-heavy work, and
return a summary. The raw file dumps, grep output, and test logs never enter the
main transcript, which keeps the cache hot and the token budget healthy.

### What each subagent is for

| Subagent | Model | When to invoke | Returns |
|---|---|---|---|
| `repo-explorer` | haiku | Before writing code, when you need to locate a file, find usages, or surface a convention example | Prioritized path list with one-line rationales |
| `frontend-reviewer` | sonnet | Explicit-invoke via `/review` — after the Implementer reports changed files | CRITICAL / RECOMMENDED / OPTIONAL / Positives / Verdict (with baked-in Security + SRE basics) |
| `test-runner` | haiku | After implementation, before the verifier gate | Pass/fail counts, failed test names, one-line cause, repro command |
| `prod-readiness` | haiku | Between Reviewer and Verifier, **only** when the plan carries a `sensitive:*` tag | 10-item Security + SRE checklist + PASS / CONCERNS / BLOCK verdict |
| `verifier` | sonnet | Before PR or merge — the final gate | Binary PASS/FAIL + prioritized issue list against a 10-bucket checklist (FAIL expands sub-item detail); defaults to FAIL |

### How to activate them

Each subagent's `description` field declares trigger keywords. In Claude Code,
phrase your request to match — the orchestrator auto-routes without an explicit
`@agent` call:

- "**find** the auth context provider" → `repo-explorer`
- "**review the diff**" / "**code review**" / "**check the changes**" → `frontend-reviewer`
- "**run tests**" / "**run jest**" / "**are tests green**" → `test-runner`
- "**prod readiness**" / "**security check**" / "**sensitive change**" → `prod-readiness`
- "**verify**" / "**ready to ship**" / "**final check**" → `verifier`

`prod-readiness` is deliberately on-demand — the pipeline invokes it
automatically when the Architect tags the plan `sensitive:*`; you rarely
call it by hand.

You can also call them explicitly: `Have repo-explorer find every place that uses
the Axios client.`

### Efficiency rules

1. **Use `repo-explorer` (haiku) for lookups instead of grepping yourself.** Broad
   "where is X" questions burn main-context tokens on raw file output. A haiku
   subagent answers for ~10× less cost and returns only the path list.
2. **Run independent subagents in parallel.** If you need a diff review and a
   test run after the same change, fire both in one turn. They don't share state.
3. **Don't fork for trivial work.** A one-file typo fix is faster done in the main
   session than handed to a subagent — the fork overhead exceeds the savings.
4. **Don't try to override subagent conventions mid-task.** Subagents do **not**
   inherit `CLAUDE.md`; the conventions they enforce are inlined in their system
   prompt. If a rule needs to change, edit the subagent file and bump the plugin
   version — don't argue with them in chat.
5. **Keep `description` fields stable.** Subagent descriptions form part of the
   cached prompt prefix. Changing wording invalidates the cache for every session
   that uses the plugin. Edit deliberately, bump the plugin version, and let teams
   re-pull.
6. **Treat the verifier as the gate, not as feedback.** It defaults to FAIL and
   demands cited evidence. Don't invoke it mid-implementation to "see how we're
   doing" — that wastes a sonnet run. Invoke it once when you believe you're done.
7. **Watch `/context` after a long session.** If the budget is tight, prefer
   subagents over main-session reads for the next chunk of work.

### Skills vs. subagents — when to use which

Skills (`component-conventions`, `pr-prep`, `pm-clarify`, `loop-engineering`)
run **in the main context** with no fork. They are convention reminders,
playbooks, and Q&A helpers — not workers. Use them when you want the rules
loaded into your active session (e.g., right before writing a new component,
opening a PR, or answering a scope question from a dev/tester). Use subagents
when you want work done **without polluting the main transcript**.

Skill triggers at a glance:

- **`component-conventions`** — "new component", "create hook", "refactor component"
- **`pr-prep`** — "open PR", "ready to ship", "before I push", "PR description"
- **`pm-clarify`** — "clarify", "what does the PRD say", "is this in scope"
- **`loop-engineering`** — "add self-critique", "add RCC loop", "iterate the plan"

---

## GitHub PR Metrics Script

`scripts/collect-pr-metrics.ts` is a CLI that collects merged-PR data from a GitHub repo,
splits it into a baseline and comparison window, and emits a velocity / size / review
report. It feeds the measurement workflow described in `metrics-collection.md` and
`pr-tracking.md` — run it weekly during a consulting engagement to produce the
before/after numbers for the metrics report.

The `scripts/` folder is **self-contained and portable**. You do not need to clone
this template — just copy the folder into any repo you want to measure. Full portable
instructions live alongside the code in [scripts/README.md](scripts/README.md).

### Use it in this repo

```bash
npm install                                # one-time
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
npm run pr-metrics -- --repo acme/web-app  # or: npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app
```

### Use it in your own repo (copy-paste)

```bash
# 1. Copy the scripts/ folder into the root of your repo
cp -R /path/to/frontend-eng-team/scripts ./scripts

# 2. Install the four dev-only deps
npm install --save-dev @octokit/rest commander tsx @types/node

# 3. Set up a GitHub PAT with the "repo" scope (https://github.com/settings/tokens)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# 4. Run it against your repo
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo
```

That's all the setup. The script does not depend on anything else from this template.
For flag reference, output formats, error handling, and test instructions, see
[scripts/README.md](scripts/README.md).

---

## Adapting This Template

This is a generic frontend team template. To adapt it for your project:

1. **CLAUDE.md + `.agents/conventions.md`** — CLAUDE.md holds project identity + tech stack + communication rules; all coding conventions (TS, React, HTTP, styling, testing, security/SRE baselines) live in `.agents/conventions.md`. Update conventions.md to match your project's actual standards; CLAUDE.md only for stack/identity changes.
2. **`.agents/roles/*.md`** — The role contracts are stack-agnostic but the Verifier's 10-bucket checklist is opinionated. Adjust it if your project has specific compliance requirements (e.g., i18n, additional accessibility levels).
3. **`.agents/pipeline.md`** — Tweak the orchestration if you want different phase boundaries, a stricter approval gate, or extra loop iterations.
4. **Tool entry points** — `.claude/commands/*.md` and `.github/copilot-instructions.md` are thin wrappers that delegate to `.agents/`. Edit them only if your Claude Code or Copilot integration changes.
5. **Test the pipeline** — Run `/pipeline` (or the Copilot paste workflow) on a small, real task from your backlog to validate the setup before team rollout.

---

## Maintenance

| File | Who owns it | When to update |
|---|---|---|
| `CLAUDE.md` | Tech lead | Stack changes, new conventions, new dependencies |
| `AGENTS.md` | Tech lead | Multi-tool entry-point updates (rare) |
| `.agents/pipeline.md` | Tech lead | Phase, approval-gate, RCC, or loop-logic changes |
| `.agents/pipeline-lite.md` | Tech lead | Lite-orchestrator changes: sensitivity keywords, verdict menu, cost thresholds, entry gate |
| `.agents/roles/pm.md` | Tech lead | PM identity, PRD format, skip-rule refinements |
| `.agents/roles/architect.md` | Tech lead | Architect identity, output-format, sensitive-tag list, or RCC checklist refinements |
| `.agents/roles/implementer.md` | Tech lead | Implementer identity, output-format, or RCC checklist refinements |
| `.agents/roles/implementer-lite.md` | Tech lead | Lite-mode Implementer overrides — keep aligned with base `implementer.md` when adding new rules |
| `.agents/roles/reviewer.md` | Tech lead | Review rubric, Security/SRE basics, and severity-level changes |
| `.agents/roles/reviewer-lite.md` | Tech lead | Lite-mode Reviewer overrides — keep aligned with base `reviewer.md` when adding new rules |
| `.agents/roles/prod-readiness.md` | Tech lead | Security + SRE deep-pass checklist, sensitive-tag triggers |
| `.agents/roles/verifier.md` | Tech lead | 10-bucket checklist or quality-gate changes |
| `.agents/memory/schema.md` | Tech lead | JSONL record shape or read/write pattern changes |
| `.agents/memory/append.sh` | Tech lead | Append helper — treat as versioned, bump plugin/repo when changed |
| `.claude/commands/*.md` | Tech lead | Claude Code slash-command wiring (only when delegation pattern changes) |
| `.claude-plugin/marketplace.json` | Tech lead | Bump plugin version entry whenever the plugin is updated |
| `plugins/frontend-team/agents/*.md` | Tech lead | Subagent contracts — bump plugin version on any change |
| `plugins/frontend-team/skills/**` | Tech lead | Skill bodies and triggers — bump plugin version on any change |
| `.github/copilot-instructions.md` | Tech lead | Copilot paste-workflow updates (only when role files change shape) |
| `scripts/ft-bootstrap.sh` | Tech lead | Bootstrap logic — update when the file map changes |
| `scripts/setup-global.md` | Tech lead | Global setup instructions — update when install commands change |
