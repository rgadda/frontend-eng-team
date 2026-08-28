# Agent Role Registry

> Canonical definitions of the roles in the multi-agent dev workflow.
> These role definitions are referenced by both Claude Code and other tools.

---

## Overview

This folder contains the canonical role definitions and orchestration for the
multi-agent development pipeline:

- **[pm.md](./roles/pm.md)** — PM role: turn fuzzy features into precise PRDs
  (skipped for bug/refactor/chore/docs)
- **[architect.md](./roles/architect.md)** — Architect role: decompose tasks
  into structured plans (with RCC self-critique)
- **[implementer.md](./roles/implementer.md)** — Implementer role: execute
  plans with precision (with RCC self-critique)
- **[reviewer.md](./roles/reviewer.md)** — Reviewer role: structured, actionable
  feedback with baked-in Security + SRE basics
- **[prod-readiness.md](./roles/prod-readiness.md)** — Production Readiness
  role: deep Security + SRE pass, invoked only for plans tagged `sensitive:*`
- **[verifier.md](./roles/verifier.md)** — Verifier role: 10-bucket quality gate (FAIL expands sub-item detail)
- **[pipeline.md](./pipeline.md)** — Pipeline orchestrator: runs all roles in
  sequence with approval gates, RCC loops, and JSONL memory hooks
- **[memory/](./memory/)** — JSONL persistence for phase summaries;
  `schema.md` documents the record shape, `append.sh` is the write helper

---

## How to Use

### For Claude Code Users

The pipeline is available as a slash command:

```
/pipeline Add a FormFieldValidator component to quick-actions
```

This automatically classifies the task, decides whether to run PM and
prod-readiness, and orchestrates the pipeline with the appropriate approval
gates.

Individual roles are also available:

```
/pm Add order confirmation modal          # features only
/pm-clarify Should the modal close on Esc?
/architect Add a FormFieldValidator component
/implement
/review src/features/QuickActions/FormFieldValidator.tsx
/verify
```

### For Copilot or Other Tool Users

1. **Reference the role definitions directly:**
   - Copy the relevant role definition (e.g., `.agents/roles/architect.md`) into your chat
   - Tell Copilot to follow that role contract

2. **Use the pipeline manually:**
   - Start with task classification (feature vs bug, sensitive or not)
   - If feature, run PM (Phase 0) → PRD approval gate
   - Run Architect (Phase 1) → plan approval gate
   - Continue through Phases 2, 3, 3.5 (if sensitive), 4

---

## Single Source of Truth

This folder is the **canonical source** for all role definitions. If a role
definition changes, it is updated here once, and all consumers (Claude Code,
Copilot, CLI, docs) reference this single source.

---

## Handoff Flow

```
Task
 ↓ [classify: type + sensitivity]
PM (features only) → branch-prd.md → [PRD APPROVAL GATE]
 ↓
ARCHITECT (RCC) → branch-plan.md → [PLAN APPROVAL GATE]
 ↓
IMPLEMENTER (RCC) → changed files
 ↓
REVIEWER → structured feedback
 ↓
PROD-READINESS (only if sensitive:*) → PASS/CONCERNS/BLOCK
 ↓
VERIFIER (10 buckets) → PASS or FAIL
 ↓ PASS → human approves merge
 ↓ FAIL → back to IMPLEMENTER (outer loop, max 3 iterations)
```

Every phase appends a summary to `memory/*.jsonl`. Downstream phases read
summaries first, full artifacts second.
