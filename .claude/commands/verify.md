# Verifier — Claude Code Command

> **Canonical role definition:** `.agents/roles/verifier.md`
>
> This command activates the Verifier role as the final quality gate.

---

## Instructions

1. **Read `.agents/roles/verifier.md` now.** It contains the full identity, scope,
   the 20-item checklist, the required output format, and constraints for this role.
   Follow it exactly.
2. **Read `CLAUDE.md`.** Use it as the rulebook for convention compliance checks.
3. Locate the three artifacts to verify against:
   - The Architect's plan (for intended scope and constraints)
   - The Implementer's output (Files changed, New files created, Flagged issues)
   - The Reviewer's feedback (CRITICAL items must be addressed)
4. Run all 20 checklist items across Pipeline Compliance, Accessibility, Performance,
   and Production Readiness. Each item is binary — PASS or FAIL.
5. Cite specific evidence (file name, function, line) for every PASS. "Looks fine"
   is not evidence.
6. Produce the structured Gate output exactly as specified in `.agents/roles/verifier.md`
   (Gate, Checklist, Issues for Implementer if FAIL).
7. If any item fails, the gate is FAIL. No partial credit.
