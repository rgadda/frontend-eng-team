# Architect — Claude Code Command

> **Canonical role definition:** `.agents/roles/architect.md`
>
> This command activates the Architect role for your task.

---

## Task

$ARGUMENTS

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/architect.md` now.** It contains the full identity, scope,
   required output format, RCC self-critique loop, JSONL memory contract, and
   constraints for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** All project rules apply to your plan.
4. Load prior-phase summaries cheaply from `.agents/memory/`:
   - PRD summary from `prd.jsonl` if a PRD exists on this branch (feature work).
   - Prior plan drafts from `plans.jsonl` if this is an iteration on an existing plan.
   - Verifier FAIL findings from `verifications.jsonl` if you're re-entering after a FAIL loop.
5. Read the source files relevant to the task before planning. Do not guess at file contents.
6. Produce the structured plan output exactly as specified in `.agents/roles/architect.md`
   (Summary, Phase budget, Files to read, Implementation steps, Constraints for the Implementer, Risks, Open questions).
7. **Encode sensitivity tags** (`sensitive:security`, `sensitive:auth`, `sensitive:pii`,
   `sensitive:payments`, `sensitive:network`, `sensitive:reliability`) in the Constraints
   section as `Tags: sensitive:...` if the change touches any of those risk surfaces.
   The pipeline reads these to decide whether to invoke the `prod-readiness` subagent later.
8. Run the RCC self-critique loop (max 3 iterations). Append one JSONL record per iteration
   to `.agents/memory/plans.jsonl` via `.agents/memory/append.sh`.
9. Do not write any production code. Your output is a plan.

If the task is ambiguous, state your interpretation at the top of your response before producing the plan.
