# Lite Pipeline Orchestrator

> **Compressed sibling of `.agents/pipeline.md`** for small, non-sensitive changes.
> Two phases only: Implementer → Reviewer. No Architect, no Verifier, no approval gates.
> Tool-neutral. Referenced by Claude Code `/pipeline-lite`, Copilot, and any other AI agent.

You are orchestrating the lite multi-agent pipeline for this frontend codebase. You are
not an agent yourself — you are the conductor. You run the two roles in sequence and
you honor the entry gate so lite mode never runs on tasks it was not designed for.

---

## Design principles

Read these before running the lite pipeline. They govern every phase.

1. **No Architect — the task text IS the spec.** Lite mode is for changes small enough
   that a written plan would cost more than it saves. If the task cannot be executed
   directly from its own description, it is too large for lite mode; escalate.
2. **No Verifier — the Reviewer is the terminal gate.** The A/B data supports this for
   changes ≤200 LOC / ≤3 files that are non-sensitive. For anything else, use `/pipeline`.
3. **No mid-pipeline approval gates.** Human review IS the merge step. Lite mode
   optimizes for tight iteration on trivial work; interrupting the flow with gates
   defeats the point.
4. **Memory writes carry `lite:true` tag.** Every JSONL record produced by a lite run
   includes `lite:true` in its `--tags` field so teams can audit adoption patterns
   (e.g., "are we using lite for sensitive changes we shouldn't be?").

---

## Task

The task to orchestrate is provided by the activating tool:

- **Claude Code:** `.claude/commands/pipeline-lite.md` substitutes `$ARGUMENTS` with
  the user's input.
- **Other tools:** paste the task into the chat alongside this file.

If you cannot find a task in the activating prompt, stop and ask the user for one.

---

## Task validation — HARD GATE (before any phase runs)

Classify the task and validate that lite mode is appropriate. This is a **hard gate**,
not a soft suggestion.

### Type check

Ask: is this one of `bugfix`, `refactor`, `chore`, `docs`, or a trivially-scoped
feature (≤200 LOC, ≤3 files, no new data model, no new user flow)?

- If yes → proceed to sensitivity check.
- If it looks like a real feature (new user flow, new data model, cross-cutting UX)
  → STOP. Print: "This looks like a feature. Use `/pipeline` for the PM + Architect
  gates. Reply `override` to force lite mode anyway." Wait for user response.

### Sensitivity check

Scan the task text (case-insensitive) for any of these keywords:

`auth`, `login`, `logout`, `signup`, `register`, `token`, `session`, `password`,
`credential`, `oauth`, `admin`, `role`, `permission`,
`payment`, `card`, `stripe`, `checkout`, `billing`, `PII`, `SSN`, `personal`,
`dangerouslySetInnerHTML`, `sanitiz`, `CSP`, `CORS`, `webhook`, `cookie`, `JWT`

If any match → STOP. Print:

```
===============================
LITE MODE ENTRY GATE — sensitive keyword detected
===============================
Matched keyword(s): <list>

This change looks sensitive. Lite mode skips the Verifier and the prod-readiness
gate. For sensitive work, use `/pipeline` instead — the full gate is designed
for exactly this kind of change.

Reply with one of:
  - "use /pipeline" → I will stop here; you re-run with the full command
  - "override"       → I proceed with lite mode; you accept the reduced coverage
  - "abort"          → pipeline ends here
```

Wait for user response. Only explicit `override` (or `use /pipeline` which ends the
run cleanly) unlocks Phase L1.

### Classification block

After validation passes, print exactly this block:

```
===============================
LITE PIPELINE CLASSIFICATION
===============================
Type: <bugfix | refactor | chore | docs | trivial-feature>
Sensitivity check: passed | overridden
Mode: lite (Implementer + Reviewer only, no gates)
Budget: ≤200 LOC / ≤3 files
```

---

## Phase L1 — IMPLEMENTER-LITE

Activate the Implementer-lite role from `.agents/roles/implementer-lite.md`. This is a
self-contained compressed contract; the sub-agent loads only this file (not the base
`implementer.md`), which is the whole point of Lite Mode's token-efficiency story.

Instructions:
- The task text from the activating prompt IS the spec. There is no plan file to load.
- Do NOT invoke the `frontend-team:repo-explorer` sub-agent. Read the files the task
  names directly; use `Glob`/`Grep` inline if paths are ambiguous.
- Apply the 5-item Lite Checklist (from `.agents/roles/implementer-lite.md`).
- Produce the compressed output format defined in `implementer-lite.md`.
- Append one JSONL record to `.agents/memory/implementations.jsonl` with
  `--tags "lite:true"` (plus any topic tags you extract from the task).

Label this section clearly:
```
===============================
PHASE L1: IMPLEMENTER-LITE OUTPUT
===============================
```

**Budget check.** If Implementer-lite reports it consumed more than 25,000 tokens
(inspect its self-reported estimate line), print a warning:

```
===============================
LITE MODE BUDGET WARNING
===============================
This task consumed ~<N>K tokens in the Implementer alone — larger than lite mode
is designed for. Consider `/pipeline` for the next task of similar size to get
Verifier coverage.
```

Warning only — do not abort. Continue to Phase L2.

---

## Phase L2 — REVIEWER-LITE

Activate the Reviewer-lite role from `.agents/roles/reviewer-lite.md`. This is a
self-contained compressed contract; the sub-agent loads only this file (not the base
`reviewer.md`), same rationale as Phase L1.

Instructions:
- Load the Implementer-lite summary from `.agents/memory/implementations.jsonl` (last
  record with `lite:true` on this branch).
- Read the changed files listed in that summary.
- Apply the 7-item CRITICAL-only checklist (from `.agents/roles/reviewer-lite.md`).
- Skip RECOMMENDED / OPTIONAL / Positives / Size-check sections entirely.
- Verdict is binary: `APPROVE` (0 CRITICALs) or `REQUEST CHANGES` (≥1 CRITICAL).
- Append one JSONL record to `.agents/memory/reviews.jsonl` with `--tags "lite:true"`
  and `--questions ""` (empty — lite mode has no sweep pass).

Label this section clearly:
```
===============================
PHASE L2: REVIEWER-LITE OUTPUT
===============================
```

---

## Verdict handling

### On APPROVE

Print:

```
===============================
LITE PIPELINE COMPLETE
===============================
Reviewer verdict: APPROVE (0 CRITICALs on lite checklist).
Changes ready for human review + merge.
Cumulative estimated tokens: input ~<TOTAL_IN>, output ~<TOTAL_OUT> across <N> JSONL records on this branch (rough; UI is authoritative).
```

Compute the rollup with this shell block (same one `pipeline.md:381-397` uses — sum
`tokens_in` / `tokens_out` across every JSONL record for the current branch):

```bash
BR="$(git rev-parse --abbrev-ref HEAD)"
{ for f in prd plans implementations reviews prod_readiness verifications; do
    grep "\"branch\":\"$BR\"" .agents/memory/$f.jsonl 2>/dev/null
  done; } | python3 -c '
import sys, json
tin = tout = n = 0
for line in sys.stdin:
    try:
        r = json.loads(line)
    except Exception:
        continue
    tin  += r.get("tokens_in")  or 0
    tout += r.get("tokens_out") or 0
    n    += 1
print(f"input ~{tin}, output ~{tout} across {n} records")
' || echo "(rollup unavailable — python3 not found)"
```

### On REQUEST CHANGES

Print the CRITICAL items verbatim, then offer three explicit options:

```
===============================
LITE PIPELINE — REQUEST CHANGES
===============================
The Reviewer flagged <N> CRITICAL item(s). Choose how to proceed:

  1. "fix"        → re-run Implementer-lite with these CRITICALs as the new spec.
                    Same lite pipeline, one iteration.
  2. "escalate"   → stop here. Re-run with `/pipeline <original task text>` to
                    get the full Verifier + prod-readiness gates on the fix.
  3. "merge"      → accept the CRITICALs and merge anyway. This is logged to
                    memory as lite:true,override:true for audit.
  4. "abort"      → stop here, no further action.
```

Wait for user response. Handle each choice:

- `fix` → re-invoke Implementer-lite with the CRITICAL items as the new spec. Loop
  back to Phase L2 to re-review. Cap at 2 fix iterations (lite mode does not have the
  full pipeline's 3-iteration outer loop; escalation is the intended path if fixes
  do not converge quickly).
- `escalate` → print the exact command to run: `/pipeline <original task text>`,
  then stop.
- `merge` → append one JSONL record to `.agents/memory/reviews.jsonl` with
  `--tags "lite:true,override:true"` and `--decisions "Verdict: OVERRIDE|Critical count: N|Merged with open CRITICALs"`. Print a warning
  that the CRITICALs remain in the code and are the human reviewer's responsibility
  to catch. Stop.
- `abort` → stop cleanly.

---

## Cost governance

- **Target run cost: ≤25K tokens end-to-end** (Implementer ~15K + Reviewer ~10K).
  If exceeded, warn the user that lite mode was over-scoped for this task.
  *This threshold is a pilot heuristic — retune once real-world lite-mode telemetry
  from a few weeks of adoption is available.*
- **No RCC outer loop.** Reviewer REQUEST CHANGES triggers at most 2 fix iterations
  before forcing escalation to `/pipeline`.
- **Skip everything.** No PM, no Architect, no Verifier, no prod-readiness, no sweep
  pass, no approval gates. Lite mode is defined by what it does not do.
- **Memory writes still happen.** `lite:true` on every record. Audit trail is
  non-negotiable.

If you find yourself about to spawn a sub-agent that is not in this pipeline — stop.
The whole point of lite mode is a minimal, deterministic run.
