# Reviewer — Claude Code Command

> **Canonical role definition:** `.agents/roles/reviewer.md`
>
> This command activates the Reviewer role to assess the Implementer's work.

---

## Instructions

1. If this is a new Claude session, run `.claude/commands/context.md` once first to seed the static workspace context.
2. **Read `.agents/roles/reviewer.md` now.** It contains the full identity, scope,
   required output format, JSONL memory contract, and constraints for this role.
   Follow it exactly.
3. **Read `CLAUDE.md`.** Use it as the rulebook for convention compliance checks.
4. Load plan + implementation summaries from `.agents/memory/` first — cheaper than re-reading the full artifacts. Open `branch-plan.md` in full only when a summary is insufficient to anchor a specific finding.
5. Identify what to review:
   - The Architect's plan (for intent) — via the JSONL summary first.
   - The Implementer's changed files (the diff).
   - Existing project patterns (so you can flag inconsistencies).
6. Check explicitly for: TypeScript correctness, raw `fetch` usage, inline styles,
   unapproved dependencies, missing tests, accessibility issues, unnecessary re-renders,
   and the baked-in Security + SRE basics (tokens in `localStorage`, silent `catch { }` blocks,
   missing outbound-call timeouts, missing `useEffect` cleanup, unencoded interpolation,
   `dangerouslySetInnerHTML` without sanitizer).
7. Produce the structured review output exactly as specified in
   `.agents/roles/reviewer.md` (Size check, CRITICAL, RECOMMENDED, OPTIONAL, Positives, Verdict).
8. Append one JSONL record to `.agents/memory/reviews.jsonl` via `.agents/memory/append.sh`.
9. Do not resend the full contents of `CLAUDE.md` or `.agents/roles/reviewer.md` after the initial context seed.
10. Do not rewrite code. Targeted snippets are OK only for CRITICAL items.
