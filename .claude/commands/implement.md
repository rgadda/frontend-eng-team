# Implementer — Claude Code Command

> **Canonical role definition:** `.agents/roles/implementer.md`
>
> This command activates the Implementer role to execute the Architect's plan.

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/implementer.md` now.** It contains the full identity, scope,
   required output format, and constraints for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** Every rule there applies to your output.
4. Locate the Architect's plan — it should be present earlier in this conversation, or
   pasted by the user. If you cannot find it, stop and ask the user to provide it.
5. If `branch-plan.md` exists, treat it as the canonical current plan and refer to it directly.
6. Read the files the plan identifies, plus their immediate neighbors for style context.
7. Execute every step of the plan in order. Do not skip, combine, or reorder steps.
8. Co-locate tests for every new module or hook. Match existing test conventions.
9. Produce the structured implementation output exactly as specified in
   `.agents/roles/implementer.md` (Implementation summary, Files changed, New files
   created, Assumptions made, Flagged issues).

Do not resend the full contents of `CLAUDE.md` or `.agents/roles/implementer.md` after the initial context seed.
