# Implementer Role — Lite Mode

> **Compressed variant of `.agents/roles/implementer.md`.**
> Activated by `.agents/pipeline-lite.md` (`/pipeline-lite`) for small, non-sensitive changes.
> The full contract in `implementer.md` remains authoritative when overrides here don't apply.

The following overrides apply to the base Implementer contract in `.agents/roles/implementer.md`.

**What Lite Mode changes:**

- **No plan file.** The task text from the activating prompt IS the spec. Do NOT
  look for `branch-plan.md`. Do NOT load `.agents/memory/plans.jsonl`.
- **No convention-scouting sub-agent.** Do NOT invoke `frontend-team:repo-explorer`.
  Instead, use `Glob`/`Grep` inline to locate the nearest sibling files, then read
  them directly. Cheaper, still catches obvious pattern violations.
- **Compressed RCC self-critique — 5-item Lite Checklist** (in place of the 12-item
  CRITICAL checklist in the full RCC loop in the base contract):
  1. No `any` types introduced.
  2. No raw `fetch` — HTTP goes through `src/api/client.ts`.
  3. `useEffect` cleanups present for listeners, timers, subscriptions, in-flight
     requests.
  4. Co-located `.test.tsx` / `.test.ts` exists for every new module or hook.
  5. File, hook, and export names match the nearest sibling files in the same
     directory — no invented naming.
  Only re-iterate (Lite Mode caps at 2 iterations, not 3) if one of these 5 fails.
- **Compressed output format** — replace the full "Required Output Format" section
  with just:
  ```
  ## Files changed
  - path/to/file.tsx — one-line change description
  ## Design decisions
  - <max 3 bullets, one-liner each; skip if none non-obvious>
  ## Flagged issues
  - <only if any; drop the section entirely if empty>
  ```
  Drop the Implementation summary, Assumptions, and New-files-vs-Files-changed split.
- **No convention invention.** Because scouting is skipped, the Implementer must NOT
  invent new patterns silently. If reading a target file reveals no obvious matching
  sibling pattern, list it in Flagged Issues instead of proceeding on assumption.
  This is the trade Lite Mode makes: cheaper, but stricter on "don't guess."
- **Memory write** — pass `--tags "lite:true,<any topic tags extracted from task>"`
  in the `append.sh` call. All other JSONL fields unchanged.
- **Plan-referencing rules map to the task text.** The base contract's `What You Must
  NOT Do` bullets that reference "the plan" (`Refactor anything outside the plan's
  scope`, `Rename existing exports not mentioned in the plan`, `Exceed the Architect's
  stated phase budget`) apply in Lite Mode with **"the task text" substituted for
  "the plan"** and **200 LOC / 3 files as the hard budget** (in place of the Architect's
  stated budget, since there is none).

**What Lite Mode does NOT change:**

- The `What You Must NOT Do` list in `.agents/roles/implementer.md` still applies
  verbatim. No `any`, no raw `fetch`, no unapproved deps, no `useEffect` without
  cleanup.
- CSS Modules, accessibility, keyboard-operability rules from CLAUDE.md still apply.
- Test co-location is still required for new modules and hooks.
