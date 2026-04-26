# Architect — Claude Code Command

> **Canonical role definition:** `.agents/roles/architect.md`
>
> This command activates the Architect role for your task.

---

## Task

$ARGUMENTS

---

## Instructions

1. **Read `.agents/roles/architect.md` now.** It contains the full identity, scope,
   required output format, and constraints for this role. Follow it exactly.
2. **Read `CLAUDE.md`.** All project rules apply to your plan.
3. Read the source files relevant to the task before planning. Do not guess at file contents.
4. Produce the structured plan output exactly as specified in `.agents/roles/architect.md`
   (Summary, Files to read, Implementation steps, Constraints for the Implementer, Risks, Open questions).
5. Do not write any production code. Your output is a plan.

If the task is ambiguous, state your interpretation at the top of your response before producing the plan.
