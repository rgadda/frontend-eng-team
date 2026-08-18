# Verifier — Claude Code Command

> **Canonical role definition:** `.agents/roles/verifier.md`
>
> This command activates the Verifier role as the final quality gate.

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/verifier.md` now.** It contains the full identity, scope,
   the **25-item** checklist, the required output format, JSONL memory contract,
   and constraints for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** Use it as the rulebook for convention compliance checks.
4. Load prior-phase summaries from `.agents/memory/`:
   - `plans.jsonl` — plan summary + sensitive tags.
   - `implementations.jsonl` — what the Implementer changed.
   - `reviews.jsonl` — Reviewer verdict + CRITICAL items.
   - `prod_readiness.jsonl` — Prod-Readiness verdict (if it ran).
   Open the full artifacts only when you need evidence that a summary doesn't provide.
5. Locate the three artifacts to verify against:
   - The Architect's plan (for intended scope, constraints, sensitive tags)
   - The Implementer's output (Files changed, New files created, Flagged issues)
   - The Reviewer's feedback (CRITICAL items must be addressed)
6. Run all **25 checklist items** across Pipeline Compliance, Accessibility, Performance,
   Production Readiness, and Security+SRE. Each item is binary — PASS or FAIL.
7. Cite specific evidence (file name, function, line) for every PASS. "Looks fine"
   is not evidence.
8. For item #25 (Prod-readiness handoff): if the plan carried `sensitive:*`, cite the
   `prod-readiness` subagent verdict (PASS/CONCERNS = pass this item, BLOCK = fail).
   If no sensitive tag was on the plan, this item is PASS with note "no sensitive tag;
   baked-in gates cover".
9. Produce the structured Gate output exactly as specified in `.agents/roles/verifier.md`
   (Gate, Checklist, Issues for Implementer if FAIL).
10. Append one JSONL record to `.agents/memory/verifications.jsonl` via `.agents/memory/append.sh`.
11. Do not resend the full contents of `CLAUDE.md` or `.agents/roles/verifier.md` after the initial context seed.
12. If any item fails, the gate is FAIL. No partial credit.
