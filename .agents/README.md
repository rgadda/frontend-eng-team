# Agent Role Registry

> Canonical definitions of the four roles in the multi-agent dev workflow.
> These role definitions are referenced by both Claude Code and other tools.

---

## Overview

This folder contains the canonical role definitions for the multi-agent development pipeline:

- **[architect.md](./roles/architect.md)** — Architect role: decompose tasks into structured plans
- **[implementer.md](./roles/implementer.md)** — Implementer role: execute plans with precision
- **[reviewer.md](./roles/reviewer.md)** — Reviewer role: provide structured, actionable feedback
- **[verifier.md](./roles/verifier.md)** — Verifier role: quality gate with 20-point checklist
- **[pipeline.md](./pipeline.md)** — Pipeline orchestrator: runs all four roles in sequence

---

## How to Use

### For Claude Code Users

The pipeline is available as a slash command:

```
/pipeline Add a FormFieldValidator component to quick-actions
```

This automatically reads all role definitions from this `.agents/` folder and orchestrates the pipeline.

Individual roles are also available:

```
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
   - Start with Phase 1 (Architect): paste `.agents/pipeline.md` Phase 1 section
   - Get Architect output, then proceed to Phase 2 (Implementer)
   - Continue through Phases 3–4 (Reviewer, Verifier)

---

## Single Source of Truth

This folder is the **canonical source** for all role definitions. If a role definition changes, it is updated here once, and all consumers (Claude Code, Copilot, CLI, docs) reference this single source.

---

## Handoff Flow

```
Task → ARCHITECT (reads files, produces plan)
         ↓ plan
       IMPLEMENTER (executes plan, produces changed files)
         ↓ changed files
       REVIEWER (reviews diff, produces structured feedback)
         ↓ review + implementation
       VERIFIER (checks all against plan + review)
         ↓ PASS → done
         ↓ FAIL → back to IMPLEMENTER with priority issue list
```

The loop between VERIFIER and IMPLEMENTER continues until PASS.
A human must approve the final PASS before merge.
