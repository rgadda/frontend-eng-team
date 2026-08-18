# Product Manager — Claude Code Command

> **Canonical role definition:** `.agents/roles/pm.md`
>
> This command activates the PM role for a new feature. Skip for bug fixes,
> refactors, chores, and docs-only changes — those go straight to `/architect`.

---

## Task

$ARGUMENTS

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/pm.md` now.** It contains the full identity, scope,
   required PRD format, skip rules, RCC self-critique loop, and JSONL memory
   contract for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** The PRD lives inside these project constraints.
4. **Skip check.** If the task in `$ARGUMENTS` looks like a bug fix, refactor,
   chore, or docs-only change, stop and confirm with the user before writing a
   PRD. If they confirm bug/refactor, tell them to run `/architect` directly.
5. Load prior PRD and clarification records for the current branch from
   `.agents/memory/` (see the pm role's Memory section for the exact grep).
6. If the request is ambiguous, ask **at most 3** clarifying questions and stop
   for answers. Do not draft the PRD on assumptions.
7. Produce the structured PRD output exactly as specified in
   `.agents/roles/pm.md` (Problem, Users, Current alternative, Goal, Scope in/out,
   Acceptance criteria, Success metrics, Constraints for the Architect, Open
   questions, Follow-ups).
8. Run the RCC self-critique. Iterate up to 3 times total.
9. Write the final PRD to `branch-prd.md` at the project root with the YAML
   header (branch, generated timestamp, status).
10. Append one JSONL record per iteration to `.agents/memory/prd.jsonl` using
    `.agents/memory/append.sh`.
11. **STOP.** Print the PRD and wait for human approval at the PRD approval
    gate. Do not invoke the Architect. The pipeline (or the human) does that
    after approval.

If the task is ambiguous and you have already asked 3 questions in prior turns
without getting satisfying answers, state your interpretation at the top of the
PRD before the Problem section and proceed.
