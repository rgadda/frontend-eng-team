# Reviewer Role — Lite Mode

> **Compressed variant of `.agents/roles/reviewer.md`.**
> Activated by `.agents/pipeline-lite.md` (`/pipeline-lite`) for small, non-sensitive changes.
> The full contract in `reviewer.md` remains authoritative when overrides here don't apply.

The following overrides apply to the base Reviewer contract in `.agents/roles/reviewer.md`.

**What Lite Mode changes:**

- **Skip the Size check section entirely.** Lite Mode is defined to be ≤200 LOC /
  ≤3 files, and the orchestrator has already validated size at entry. If files-changed
  exceeds 3 or LOC exceeds 200, that IS a CRITICAL: "this task is too large for lite
  mode; re-run with `/pipeline` to get Verifier coverage."
- **CRITICAL-only output.** Skip RECOMMENDED, OPTIONAL, and Positives sections
  entirely. Verdict is binary: `APPROVE` (no CRITICALs) or `REQUEST CHANGES`
  (≥1 CRITICAL). No `APPROVE WITH CHANGES` — that verdict depends on a sweep pass
  that lite mode does not run.
- **Focused 7-item CRITICAL checklist** (in place of the full check surfaces list in
  the base contract):
  1. `any` type usage anywhere in the diff.
  2. Raw `fetch` (must use shared Axios client).
  3. Missing `useEffect` cleanup (listeners, timers, subscriptions, in-flight
     requests, `AbortController`).
  4. Missing accessible name on interactive elements (button without label, input
     without `id`+`<label>` or `aria-label`, etc.).
  5. Missing `@media (prefers-reduced-motion: no-preference)` guard on any CSS
     `transition` or `animation` declaration.
  6. Security basics: tokens in `localStorage`/`sessionStorage`, silent `catch {}`
     blocks, `dangerouslySetInnerHTML` without an explicit sanitizer,
     unencoded URL interpolation.
  7. Convention drift from nearest sibling file (naming, import order, error-handling
     shape) — cite the sibling file when flagging.
- **Do NOT scan for RECOMMENDED-level items.** Unnecessary re-renders, missed
  opportunities to reuse a helper, incomplete error-state UI, missing Positives to
  reinforce — these belong in full-pipeline reviews. In Lite Mode, silence on
  non-CRITICALs is the correct behavior.
- **Compressed output format** — replace the full "Required Output Format" section
  with just:
  ```
  ## CRITICAL
  - [file:line] Problem → Suggested fix
  (or: "None." if the checklist passes)

  ## Verdict
  APPROVE | REQUEST CHANGES
  ```
- **Memory write** — pass `--tags "lite:true,<plan tags if any>"`,
  `--decisions "Verdict: <APPROVE|REQUEST CHANGES>|Critical count: N|Mode: lite"`,
  and `--questions ""` (empty string — Lite Mode does not populate the sweep-pass
  source). All other JSONL fields unchanged.

**What Lite Mode does NOT change:**

- The `What You Must NOT Do` list in `.agents/roles/reviewer.md` still applies
  verbatim. Convention drift is still CRITICAL (item 7 above is the same rule,
  just scoped tighter).
- Compressed communication style for chat-facing prose still applies; CRITICAL
  findings stay in normal English so they read cleanly if pasted into a PR comment.
