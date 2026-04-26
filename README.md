# Frontend AI Pipeline — Setup Guide

This template wires a **four-role multi-agent pipeline** (Architect → Implementer →
Reviewer → Verifier) into a frontend codebase. The role contracts live in `.agents/`
and are tool-neutral, so the same pipeline runs in Claude Code, GitHub Copilot, or
any other AI tool that can read project files.

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
│   ├── pipeline.md                      Orchestrator: phases, approval gate, loop logic.
│   └── roles/
│       ├── architect.md                 Architect role contract
│       ├── implementer.md               Implementer role contract
│       ├── reviewer.md                  Reviewer role contract
│       └── verifier.md                  Verifier role contract
│
├── .claude/
│   └── commands/                      <- Claude Code slash-command entry points.
│       ├── architect.md                 /architect <task>  → reads .agents/roles/architect.md
│       ├── implement.md                 /implement         → reads .agents/roles/implementer.md
│       ├── review.md                    /review            → reads .agents/roles/reviewer.md
│       ├── verify.md                    /verify            → reads .agents/roles/verifier.md
│       └── pipeline.md                  /pipeline <task>   → reads .agents/pipeline.md
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
    └── collect-pr-metrics.ts          <- Self-contained CLI for measuring PR velocity.
                                          See scripts/README.md for portable usage.
```

---

## How to activate the agents

The role definitions are the same across every tool — only the activation mechanism changes.

### Claude Code (slash commands)

`CLAUDE.md` is auto-loaded at session start, so project rules apply to every conversation.
Slash commands in `.claude/commands/` become `/architect`, `/implement`, `/review`,
`/verify`, and `/pipeline`. Each command file imperatively reads its matching
`.agents/roles/*.md` (or `.agents/pipeline.md` for the orchestrator) and follows it.

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

### Quick implementation (for small, low-risk tasks)

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

1. **CLAUDE.md** — Update the tech stack table, styling conventions, and "never do" list to match your project's actual stack and standards.
2. **`.agents/roles/*.md`** — The role contracts are stack-agnostic but the Verifier's 19-item checklist is opinionated. Adjust it if your project has specific compliance requirements (e.g., i18n, additional accessibility levels).
3. **`.agents/pipeline.md`** — Tweak the orchestration if you want different phase boundaries, a stricter approval gate, or extra loop iterations.
4. **Tool entry points** — `.claude/commands/*.md` and `.github/copilot-instructions.md` are thin wrappers that delegate to `.agents/`. Edit them only if your Claude Code or Copilot integration changes.
5. **Test the pipeline** — Run `/pipeline` (or the Copilot paste workflow) on a small, real task from your backlog to validate the setup before team rollout.

---

## Maintenance

| File | Who owns it | When to update |
|---|---|---|
| `CLAUDE.md` | Tech lead | Stack changes, new conventions, new dependencies |
| `AGENTS.md` | Tech lead | Multi-tool entry-point updates (rare) |
| `.agents/pipeline.md` | Tech lead | Phase, approval-gate, or loop-logic changes |
| `.agents/roles/architect.md` | Tech lead | Architect identity, output-format, or constraint refinements |
| `.agents/roles/implementer.md` | Tech lead | Implementer identity, output-format, or constraint refinements |
| `.agents/roles/reviewer.md` | Tech lead | Review rubric and severity-level changes |
| `.agents/roles/verifier.md` | Tech lead | 19-item checklist or quality-gate changes |
| `.claude/commands/*.md` | Tech lead | Claude Code slash-command wiring (only when delegation pattern changes) |
| `.github/copilot-instructions.md` | Tech lead | Copilot paste-workflow updates (only when role files change shape) |
