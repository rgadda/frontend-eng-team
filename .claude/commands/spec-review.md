# Spec Review — Claude Code Command

> **Backing subagent:** `agents/spec-reviewer.md` (fresh session, read-only)
>
> Checks the current branch's diff against the acceptance criteria in
> `branch-plan.md` (or a provided spec path). Does NOT check conventions,
> security, or build — use `/review` and `/verify` for those.

---

## Instructions

1. Locate the spec:
   - Default: `branch-plan.md` at the project root.
   - If the user provided a path as an argument, use that instead.
   - If neither exists, stop and ask the user to point at a spec file or create `branch-plan.md`.

2. Capture the diff. Run:
   ```bash
   mkdir -p .agents/memory
   git diff "$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||' || echo main)"...HEAD > .agents/memory/current-diff.patch
   ```
   This writes the branch's full diff against the default branch. If the diff is empty, stop and tell the user: "No diff vs. the default branch — nothing to review."

3. Capture test output. If the user has NOT already run tests this session, run them now and redirect:
   ```bash
   npm test > .agents/memory/test-output.log 2>&1 || true
   ```
   (The `|| true` keeps the pipeline alive when tests fail — the subagent reads the log to find failures.) If the project doesn't have an `npm test` script, note that and let the subagent handle `test output: not captured`.

4. Invoke the `spec-reviewer` subagent with a short prompt:
   > Review the current branch's diff against the acceptance criteria in `branch-plan.md` (or the spec path above). The diff is at `.agents/memory/current-diff.patch`. Test output is at `.agents/memory/test-output.log`. Return the AC matrix exactly as specified in your output format.

5. Return the subagent's output verbatim to the user. Do NOT rewrite its verdict.

6. If the overall verdict is FAIL or PARTIAL, suggest the next step as a single line:
   - Missing implementation → "Resume `/implement` for the failing ACs."
   - Missing tests → "Add tests for the PARTIAL ACs before re-running `/spec-review`."
   - Unclear AC → "Run `/pm-clarify` to disambiguate the AC."

Do not run `/review` or `/verify` yourself — those are separate gates that the user triggers when they're ready.
