# Reviewer — Claude Code Command

> **Canonical role definition:** `.agents/roles/reviewer.md`
>
> This command activates the Reviewer role to assess the Implementer's work.

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/reviewer.md` now.** It contains the full identity, scope,
   required output format, and constraints for this role. Follow it exactly.
3. **Read `CLAUDE.md`.** Use it as the rulebook for convention compliance checks.
4. Identify what to review:
   - The Architect's plan (for intent)
   - The Implementer's changed files (the diff)
   - Existing project patterns (so you can flag inconsistencies)
5. Check explicitly for: TypeScript correctness, raw `fetch` usage, inline styles,
   unapproved dependencies, missing tests, accessibility issues, security issues,
   and unnecessary re-renders.
6. Produce the structured review output exactly as specified in
   `.agents/roles/reviewer.md` (CRITICAL, RECOMMENDED, OPTIONAL, Positives, Verdict).
7. Do not resend the full contents of `CLAUDE.md` or `.agents/roles/reviewer.md` after the initial context seed.
8. Do not rewrite code. Targeted snippets are OK only for CRITICAL items.
