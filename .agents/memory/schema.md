# Agent Memory — JSONL schema

> Persistent, append-only, one record per line. Each role writes one record at
> the end of each phase (and one per RCC iteration). Downstream roles read the
> last N records instead of re-loading full prior artifacts, which is how this
> file cuts token consumption over the life of a branch.

---

## Files

Located under `.agents/memory/`. All are gitignored by default.

| File | Written by | Read by |
|---|---|---|
| `prd.jsonl` | PM | Architect, Implementer, PM-clarify, Reviewer |
| `plans.jsonl` | Architect | Implementer, Reviewer, Verifier, Prod-Readiness |
| `implementations.jsonl` | Implementer | Reviewer, Verifier, Prod-Readiness |
| `reviews.jsonl` | Reviewer | Verifier, Implementer (on FAIL loop) |
| `prod_readiness.jsonl` | Prod-Readiness subagent | Verifier |
| `verifications.jsonl` | Verifier | Implementer (on FAIL loop), PM (retro) |
| `clarifications.jsonl` | PM-clarify skill | PM-clarify (dedupe), PM (retro) |
| `summaries.jsonl` | `prune.sh` compactor | All roles (long-term rollup) |

---

## Record shape (all files share the same envelope)

```json
{
  "ts": "2026-08-17T14:22:31Z",
  "branch": "feat/user-profile",
  "task_id": "sha256:abc123…",
  "phase": "architect",
  "iteration": 1,
  "status": "final",
  "summary": "One paragraph: what this artifact decides or produces.",
  "key_decisions": ["decision 1", "decision 2"],
  "open_questions": [],
  "tags": ["sensitive:security"],
  "artifact_ref": "branch-plan.md@<git-sha-or-hash>",
  "tokens_in": 4200,
  "tokens_out": 1100
}
```

### Fields

- **`ts`** — UTC ISO 8601. Written at record append time.
- **`branch`** — output of `git rev-parse --abbrev-ref HEAD`. Enables per-branch filtering.
- **`task_id`** — `sha256` of the normalized (lowercased, whitespace-collapsed) original user task string. Stable across the pipeline so all records for one task join together.
- **`phase`** — one of `pm`, `architect`, `implementer`, `reviewer`, `prod_readiness`, `verifier`, `pm_clarify`.
- **`iteration`** — 1-indexed. Increments each RCC critique-refine pass within a phase. Final artifact carries the highest iteration + `status: "final"`.
- **`status`** — `draft` (mid-RCC), `final` (converged), `failed` (blocker flagged), `skipped` (phase skipped by pipeline rule — record still written for auditability).
- **`summary`** — one paragraph, ≤500 chars. This is what downstream roles read *first* to avoid re-parsing full artifacts.
- **`key_decisions`** — array of short strings. The load-bearing choices from this phase.
- **`open_questions`** — carried forward until answered. Empty array when none.
- **`tags`** — free-form. Reserved values that gate the pipeline: `sensitive:security`, `sensitive:reliability`, `sensitive:pii`, `sensitive:auth`, `sensitive:network`, `sensitive:payments`, `type:feature`, `type:bugfix`, `type:refactor`, `type:chore`.
- **`artifact_ref`** — pointer to the full artifact (usually `branch-prd.md` or `branch-plan.md` at a specific SHA). Read only when the summary + decisions are insufficient.
- **`tokens_in` / `tokens_out`** — rough estimates for cost telemetry. Optional but recommended.

---

## Read pattern (how downstream roles use it to save tokens)

Instead of re-reading full prior artifacts, each role does:

```bash
# Load only the last N records for this branch, filtered to the phases you care about.
grep "\"branch\":\"$(git rev-parse --abbrev-ref HEAD)\"" .agents/memory/plans.jsonl | tail -3
```

- **PM** on rerun: pulls its own last 3 records + open_questions from prior clarifications
- **Architect**: pulls the last PRD record's summary + key_decisions (skips reading `branch-prd.md` in full unless a decision is ambiguous)
- **Implementer**: pulls last plan record + any Verifier FAIL records from prior loops
- **Reviewer**: pulls last plan summary + last implementation summary
- **Verifier**: pulls plan summary + implementation summary + review summary (falls back to full files only if evidence is missing)
- **Prod-Readiness**: pulls plan summary + implementation summary; runs only if plan is tagged `sensitive:*`

Rule of thumb: **summaries are the default context; full artifacts are the escalation.**

---

## Write pattern

Use `.agents/memory/append.sh` — do not hand-write JSONL. The helper:
- normalizes the `ts` field
- resolves `branch` from git
- hashes `task_id` from the provided task string
- validates the record is single-line JSON before append
- creates the target file if it does not exist

```bash
.agents/memory/append.sh <file> <phase> <iteration> <status> <summary> [--tags tag1,tag2] [--task "original task"] [--decisions "d1|d2"] [--questions "q1|q2"] [--artifact-ref path@sha]
```

Example:
```bash
.agents/memory/append.sh plans.jsonl architect 2 final \
  "Split into 2 phases; Phase 1 adds ConfirmDialog, Phase 2 wires it into orders flow." \
  --task "add confirmation modal for destructive order actions" \
  --tags "sensitive:security,type:feature" \
  --decisions "Portal-based dialog|Focus trap via useFocusTrap hook|No new deps" \
  --artifact-ref "branch-plan.md@$(git rev-parse HEAD)"
```

---

## Retention

- Records accumulate on the developer machine. Nothing is committed by default.
- `.agents/memory/prune.sh` (future) will compact records older than 30 days into `summaries.jsonl` — one rollup line per (branch, task_id).
- Never edit records in place. If a record is wrong, append a corrective record with a note in `summary`.

---

## Failure mode

If `append.sh` errors (permissions, disk full, malformed input), the calling role must:
1. Print a one-line warning to the conversation ("memory append failed: <reason>").
2. Continue the pipeline. Memory is an optimization, never a correctness dependency.
3. Not retry more than once. Silent retries mask disk/permission issues.
