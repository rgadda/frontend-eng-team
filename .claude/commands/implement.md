# Implementer — Claude Code Command

> **Canonical role definition:** `.agents/roles/implementer.md`
>
> This command activates the Implementer role to execute the Architect's plan.

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/implementer.md` now.** It contains the full identity, scope,
   required output format, RCC self-critique loop, JSONL memory contract, and
   constraints for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** Every rule there applies to your output.
4. Load prior-phase summaries cheaply from `.agents/memory/`:
   - Plan summary from `plans.jsonl` — this is your primary spec.
   - Prior implementation attempts from `implementations.jsonl` if the outer FAIL loop iterated.
   - Verifier FAIL findings from `verifications.jsonl` if you're re-entering after a FAIL.
5. Locate the Architect's plan. If `branch-plan.md` exists, treat it as the canonical current plan — but read the JSONL summary first and open the full file only when a step is ambiguous. If neither the summary nor the file is available, stop and ask the user to provide the plan.
6. Read the files the plan identifies, plus their immediate neighbors for style context.
7. Execute every step of the plan in order. Do not skip, combine, or reorder steps.
8. If the plan carries `sensitive:*` tags, be extra deliberate on the specific concerns those tags flag (token storage, input sanitization, timeouts, error paths, cleanup).
9. Co-locate tests for every new module or hook. Match existing test conventions.
10. Run the RCC self-critique loop (max 3 iterations). Append one JSONL record per iteration to `.agents/memory/implementations.jsonl` via `.agents/memory/append.sh`.
11. Produce the structured implementation output exactly as specified in
    `.agents/roles/implementer.md` (Implementation summary, Files changed, New files
    created, Assumptions made, Flagged issues).

Do not resend the full contents of `CLAUDE.md` or `.agents/roles/implementer.md` after the initial context seed.
