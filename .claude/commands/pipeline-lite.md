# Lite Pipeline Orchestrator — Claude Code Entry Point

> **This is the Claude Code integration point for the lite pipeline.**
> The canonical lite pipeline definition lives in `.agents/pipeline-lite.md`.
> This command delegates to that definition.

---

## Task

$ARGUMENTS

---

**The lite multi-agent pipeline is orchestrated in `.agents/pipeline-lite.md`.**

Lite mode is for **small, non-sensitive changes only** (≤200 LOC / ≤3 files,
no auth / payments / PII / security-sensitive paths). For anything larger or
sensitive, use `/pipeline` instead — the full gate is designed for that.

If this is a new Claude session, run `.claude/commands/context.md` once first to
seed the static workspace context.

Follow that file for:
- Task validation gate (type + sensitivity keyword scan; hard-stops on failure)
- Phase L1 (Implementer-lite) — task text IS the spec, 5-item Lite Checklist
- Phase L2 (Reviewer-lite) — 7-item CRITICAL-only checklist, binary verdict
- Verdict handling (APPROVE / REQUEST CHANGES with fix|escalate|merge|abort choice)
- JSONL memory writes tagged `lite:true` (`.agents/memory/*.jsonl`)

**Role definitions are in `.agents/roles/`:**
- Implementer: `.agents/roles/implementer.md` (with `## Lite Mode` section)
- Reviewer: `.agents/roles/reviewer.md` (with `## Lite Mode` section)

**Memory schema:** `.agents/memory/schema.md`. Append helper: `.agents/memory/append.sh`.

---

## Quick Start

1. Read `.agents/pipeline-lite.md` for the full lite orchestration logic
2. Run the task-validation gate (type + sensitivity check) — hard-stop on failure
3. If validation passes, print the classification block
4. Run Phase L1 (Implementer-lite) — read `## Lite Mode` in `implementer.md`
5. Run Phase L2 (Reviewer-lite) — read `## Lite Mode` in `reviewer.md`
6. Handle the verdict per the four-choice menu in `pipeline-lite.md`
