# Pipeline Orchestrator — Claude Code Entry Point

> **This is the Claude Code integration point for the pipeline.**
> The canonical pipeline definition lives in `.agents/pipeline.md`.
> This command delegates to that definition.

---

## Task

$ARGUMENTS

---

**The multi-agent pipeline is orchestrated in `.agents/pipeline.md`.**

Follow that file for:
- Phase 1 (Architect) instructions and output format
- Approval gate (hard stop before Phase 2)
- Phase 2 (Implementer) instructions and output format
- Phase 3 (Reviewer) instructions and output format
- Phase 4 (Verifier) instructions and output format
- Loop logic (FAIL → Implementer → re-verify)

**Role definitions are in `.agents/roles/`:**
- Architect: `.agents/roles/architect.md`
- Implementer: `.agents/roles/implementer.md`
- Reviewer: `.agents/roles/reviewer.md`
- Verifier: `.agents/roles/verifier.md`

---

## Quick Start

1. Read `.agents/pipeline.md` for the full orchestration logic
2. Follow Phase 1 (read the task, plan the implementation)
3. Wait for user approval at the gate
4. Proceed through Phases 2–4 on approval
5. Loop until Verifier PASS
