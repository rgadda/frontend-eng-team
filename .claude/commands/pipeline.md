# Pipeline Orchestrator — Claude Code Entry Point

> **This is the Claude Code integration point for the pipeline.**
> The canonical pipeline definition lives in `.agents/pipeline.md`.
> This command delegates to that definition.

---

## Task

$ARGUMENTS

---

**The multi-agent pipeline is orchestrated in `.agents/pipeline.md`.**

If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.

Follow that file for:
- Task classification (type + sensitivity) that decides whether PM and prod-readiness fire
- Phase 0 (PM) — features only; skipped for bug/refactor/chore/docs
- PRD approval gate (hard stop, only if PM ran)
- Phase 1 (Architect) with RCC self-critique loop
- Plan approval gate (hard stop before Phase 2)
- Phase 2 (Implementer) with RCC self-critique loop
- Phase 3 (Reviewer) with baked-in Security + SRE basics
- Phase 3.5 (Prod-Readiness) — fires only when the plan carries a `sensitive:*` tag
- Phase 4 (Verifier) — full 10-bucket checklist (FAIL expands sub-item detail)
- Outer loop logic (FAIL → Implementer → re-verify, capped at 3 iterations)
- JSONL memory contract at every phase (`.agents/memory/*.jsonl`)

**Role definitions are in `.agents/roles/`:**
- PM: `.agents/roles/pm.md`
- Architect: `.agents/roles/architect.md`
- Implementer: `.agents/roles/implementer.md`
- Reviewer: `.agents/roles/reviewer.md`
- Prod-Readiness: `.agents/roles/prod-readiness.md`
- Verifier: `.agents/roles/verifier.md`

**Memory schema:** `.agents/memory/schema.md`. Append helper: `.agents/memory/append.sh`.

---

## Quick Start

1. Read `.agents/pipeline.md` for the full orchestration logic
2. Classify the task (type + sensitivity) and print the classification block
3. Run Phase 0 (PM) if it is a feature; wait at the PRD approval gate
4. Run Phase 1 (Architect); wait at the plan approval gate
5. Proceed through Phases 2, 3, 3.5 (conditional), 4 on approval
6. Loop until Verifier PASS or 3 outer iterations
