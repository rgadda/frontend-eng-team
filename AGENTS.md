# Agent Role Contracts

> **Source of truth:** All role definitions live in `.agents/roles/`.
> This file is the cross-tool entry point — Claude Code, Copilot, and any other
> AI agent should start here and load the canonical contracts from `.agents/`.

---

## Canonical role definitions

The six roles in the multi-agent pipeline are defined in `.agents/roles/`.
Two of them are conditional — the pipeline skips them when the task does not
warrant the extra cost.

### [PM](./.agents/roles/pm.md)
- **Purpose:** Turns fuzzy feature requests into precise PRDs (Problem, Scope,
  Acceptance criteria, Success metrics)
- **Activation:** `/pm` in Claude Code, or load the role file into any other tool
- **When:** New features only. Skipped for bug fixes, refactors, chores, docs.
- **Artifact:** `branch-prd.md` at project root (transient, gitignored)
- **Clarify escalation:** `/pm-clarify` — devs/testers ask questions grounded
  in the PRD, escalate to human PM only when the PRD does not cover it

### [Architect](./.agents/roles/architect.md)
- **Purpose:** Decomposes tasks into structured implementation plans
- **Activation:** `/architect` in Claude Code, or load the role file into any other tool
- **Key traits:** Systems thinking, precision, skepticism of complexity, tags
  the plan with `sensitive:*` when the change touches high-risk surfaces
- **Loop:** RCC self-critique, max 3 iterations

### [Implementer](./.agents/roles/implementer.md)
- **Purpose:** Executes plans with expert-level craft
- **Activation:** `/implement` in Claude Code, or load the role file into any other tool
- **Key traits:** Precision, discipline, production-grade code
- **Loop:** RCC self-critique, max 3 iterations

### [Reviewer](./.agents/roles/reviewer.md)
- **Purpose:** Provides structured, actionable feedback — including baked-in
  Security and SRE basics (tokens in `localStorage`, silent catches, missing
  timeouts, missing `useEffect` cleanup)
- **Activation:** `/review` in Claude Code, or load the role file into any other tool
- **Key traits:** Staff-level review experience, teaching focus

### [Prod-Readiness](./.agents/roles/prod-readiness.md) — conditional
- **Purpose:** Dedicated Security + SRE pass with a 10-item checklist
- **Activation:** Invoked automatically by the pipeline **only** when the plan
  carries a `sensitive:*` tag (`sensitive:security`, `sensitive:auth`,
  `sensitive:pii`, `sensitive:payments`, `sensitive:network`,
  `sensitive:reliability`). Backed by the `prod-readiness` haiku subagent.
- **Verdict:** PASS / CONCERNS / BLOCK

### [Verifier](./.agents/roles/verifier.md)
- **Purpose:** Quality gate with a **10-bucket** checklist (plan coverage, tooling gates,
  conventions, tests, constraints+structure, PR size, accessibility, performance,
  production+security/SRE, prod-readiness handoff). FAIL expands sub-item detail.
- **Activation:** `/verify` in Claude Code, or load the role file into any other tool
- **Key traits:** Evidence-based verification, production readiness

---

## Pipeline orchestration

The full pipeline is orchestrated in [`.agents/pipeline.md`](./.agents/pipeline.md):

0. **Task classification** — type (feature | bugfix | refactor | chore | docs)
   and sensitivity (`sensitive:*` tags). Determines which phases fire.
1. **Phase 0 — PM:** produces the PRD (features only)
2. **PRD approval gate:** human reviews and explicitly approves (only if PM ran)
3. **Phase 1 — Architect:** produces the structured plan, tags it sensitive when applicable
4. **Plan approval gate:** human reviews and explicitly approves the plan
5. **Phase 2 — Implementer:** executes the approved plan
6. **Phase 3 — Reviewer:** provides feedback on the implementation
7. **Phase 3.5 — Prod-Readiness:** Security + SRE deep pass — **only** if plan has `sensitive:*` tag
8. **Phase 4 — Verifier:** runs the 10-bucket checklist for the final PASS/FAIL gate
9. **Outer loop:** on FAIL, return to the Implementer with a prioritized issue list (max 3 outer iterations)

Every phase runs an RCC self-critique inner loop (max 3 iterations) and appends
a summary to `.agents/memory/*.jsonl` — downstream phases read the summaries
first to save tokens.

---

## Memory

Persistent JSONL memory lives in [`.agents/memory/`](./.agents/memory/):

- Schema: [`.agents/memory/schema.md`](./.agents/memory/schema.md)
- Append helper: `.agents/memory/append.sh <file> <phase> <iter> <status> <summary> [flags]`
- Files: `prd.jsonl`, `plans.jsonl`, `implementations.jsonl`, `reviews.jsonl`,
  `prod_readiness.jsonl`, `verifications.jsonl`, `clarifications.jsonl`
- All memory files are **gitignored** by default — they are personal workspace,
  not team-shared. Committing them is opt-in per team.

Downstream phases read summaries with `grep`:

```bash
grep "\"branch\":\"$(git rev-parse --abbrev-ref HEAD)\"" .agents/memory/plans.jsonl | tail -1
```

Open full artifacts only when a summary is insufficient. This is where the
token savings compound over the life of a branch.

---

## How to activate the agents

### Claude Code

Slash commands are wired to the canonical definitions:

```
/pipeline [task]      # Full pipeline orchestration with approval gates
/pm [task]            # PM role — features only
/pm-clarify [question]# Dev/tester PRD clarification
/architect [task]     # Architect role only
/implement            # Execute the Architect's plan
/review               # Review the Implementer's changes
/verify               # Run the 10-bucket quality gate
```

Each Claude Code command file in `.claude/commands/` reads the matching `.agents/roles/*.md`
and follows its contract exactly.

### Copilot

See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for the
end-to-end paste-driven workflow. In short:

1. Open the relevant `.agents/roles/<role>.md` file.
2. Paste its contents into the Copilot chat with the directive: "Activate this role and follow its contract."
3. Provide the task (or the prior phase's output) as input.

### Other AI tools

Any tool that supports a project-level instruction file (the `AGENTS.md` convention)
will land here first. Treat this file as a router: load the role files in `.agents/roles/`
and the orchestration in `.agents/pipeline.md`, follow the contracts as written, and
read `CLAUDE.md` for project constraints before producing code.

---

## File map

```
.agents/                          ← Canonical role definitions (source of truth)
  README.md                       (overview and usage guide)
  pipeline.md                     (orchestrator — phases, gates, RCC, JSONL hooks)
  conventions.md                  (canonical non-negotiables — TS/React/HTTP/styling/testing/a11y/perf/security)
  roles/
    pm.md                         (new — features only)
    architect.md
    implementer.md
    reviewer.md
    prod-readiness.md             (new — conditional, invoked on sensitive:* tags)
    verifier.md
  memory/                         (new — JSONL persistence; gitignored)
    schema.md
    append.sh
    prd.jsonl, plans.jsonl, ...   (created on demand by append.sh)

.claude/commands/                 ← Claude Code entry points (delegate to .agents/)
  pipeline.md
  pm.md                           (new)
  pm-clarify.md                   (new — thin invoker for the skill)
  architect.md
  implement.md
  review.md
  verify.md

plugins/frontend-team/            ← Versioned subagents + skills
  agents/
    repo-explorer.md              (haiku)
    frontend-reviewer.md          (sonnet)
    test-runner.md                (haiku)
    verifier.md                   (sonnet, 10-bucket checklist)
    prod-readiness.md             (haiku, conditional)
  skills/
    component-conventions/
    pr-prep/
    pm-clarify/                   (new — main-context PRD Q&A)
    loop-engineering/             (new — RCC pattern reference)

.github/copilot-instructions.md   ← Copilot entry point (paste workflow for .agents/)

AGENTS.md                         ← This file — generic multi-tool entry point
CLAUDE.md                         ← Project identity, rules, conventions
branch-prd.md                     ← Transient PRD artifact (gitignored, features only)
branch-plan.md                    ← Transient plan artifact (gitignored)
```

---

## Handoff flow

All roles enforce `.agents/conventions.md` (loaded once as canonical
non-negotiables; subagents that do not inherit CLAUDE.md load it explicitly).

```
Task
 ↓ [classify: type + sensitivity]
 ↓
PM (features only) → branch-prd.md → [PRD APPROVAL GATE — human]
 ↓
ARCHITECT (RCC inner loop) → branch-plan.md (with sensitive:* tags) → [PLAN APPROVAL GATE — human]
 ↓
IMPLEMENTER (RCC inner loop) → changed files
 ↓
REVIEWER (baked-in Security/SRE basics) → structured feedback
 ↓
PROD-READINESS (only if plan tagged sensitive:*) → PASS/CONCERNS/BLOCK
 ↓ BLOCK → back to IMPLEMENTER (counts against outer 3-iteration cap)
 ↓ PASS/CONCERNS ↓
VERIFIER (10-bucket checklist) → PASS or FAIL
 ↓ PASS → human approves merge
 ↓ FAIL → back to IMPLEMENTER (outer loop, max 3 iterations)
```

Every phase appends a JSONL summary to `.agents/memory/`. Downstream phases
read summaries first, artifacts second. This is the token discipline that
keeps the pipeline cheap over a branch's lifecycle.
