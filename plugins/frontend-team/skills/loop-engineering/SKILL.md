---
name: loop-engineering
description: Load this when authoring or editing an agent role, subagent, or slash command that needs a self-critique / iterate / converge inner loop. Documents the Refine-Critique-Converge (RCC) pattern used by every role in .agents/roles/. Triggers — "add self-critique", "add RCC loop", "iterate the plan", "loop engineering", "agent should refine", "critique its own output".
---

# Loop Engineering — the RCC pattern

Loop engineering treats iteration as a first-class part of an agent's contract,
not an emergent behavior. Every role in this repo uses the same Refine-Critique-
Converge (RCC) pattern for its inner loop. This skill is the reference for how
to add or modify one.

## What RCC is

An agent produces → self-critiques against a phase-specific checklist → refines
only the parts flagged CRITICAL → repeats, bounded to 3 iterations. On
convergence (no CRITICAL, or no delta from prior iteration, or 3-iteration cap
hit) it emits the final artifact plus a compact iteration log.

## Why RCC and not "keep iterating"

- **Bounded.** 3-iteration cap prevents runaway cost. If the agent cannot
  converge in 3 passes, the problem is upstream (bad spec, missing context) and
  further iteration will not fix it — hand back to the human.
- **Same-context.** RCC runs inside the same phase's context window. No new
  agent is spawned. This is the cheapest form of loop engineering.
- **Targeted.** Iterations 2 and 3 revise only sections flagged CRITICAL, not
  the whole artifact. Full rewrites erode the cache and re-introduce bugs.
- **Auditable.** Each iteration appends a JSONL record with
  `status: "draft"` or `"final"`. You can see the convergence trajectory after
  the fact.

## The template (paste this into a new role)

```
## Refine-Critique-Converge (RCC) loop

You produce, self-critique, and refine — bounded to 3 iterations.

**Iteration 1** — produce the artifact in the required format.

**Self-critique** — before printing, walk this checklist against your draft.
Any CRITICAL item requires a revision pass.

- CRITICAL: <phase-specific check 1>
- CRITICAL: <phase-specific check 2>
- CRITICAL: <phase-specific check 3>
- RECOMMENDED: <check that's nice-to-have but not blocking>

**Iteration 2** — if any CRITICAL, revise only the affected sections and
re-critique.

**Iteration 3** — final pass. If a CRITICAL remains after 3 iterations, print
the artifact with an "RCC unresolved" note at the top listing open CRITICALs.
Do not loop further — hand off to the human.

Append one JSONL record per iteration to `.agents/memory/<file>.jsonl` via
`.agents/memory/append.sh` (`status: "draft"` for iterations 1-2, `status:
"final"` on the last).
```

## Choosing checklist items

The checklist is the entire ballgame — a good checklist makes RCC valuable, a
bad one makes it noise. Rules:

- **CRITICAL only for correctness-blocking items** — things that make the
  artifact wrong or unshippable. Style preferences do not belong here.
- **3-6 CRITICALs, max.** More than that and the agent will oscillate.
- **Every check must be answerable from the artifact alone.** If the check
  requires reading external files, it belongs in a downstream phase's check,
  not RCC.
- **Prefer specific over general.** "No `any` types introduced?" beats "Types
  are correct?" — the former is grep-able, the latter is vibes.

## Interaction with the outer FAIL loop

The pipeline has an outer Verifier→Implementer FAIL loop, also capped at 3.
RCC is the *inner* loop.

- RCC iterations do not count against the outer loop cap.
- If a role hits its RCC cap without convergence, the outer loop can still
  attempt another pass (with a new spec — usually the Verifier's priority
  list).
- Combined cap: at most 3 outer × 3 RCC = 9 iterations per role per branch.
  In practice, most work converges in 1-2 outer × 1-2 RCC.

## When NOT to add RCC

- **Read-only subagents** (`repo-explorer`, `frontend-reviewer`,
  `prod-readiness`) that produce a single structured output already do a
  focused pass. Adding RCC would just double their cost. Their "critique" is
  the downstream role that reads their output.
- **Bash / tool-running subagents** (`test-runner`, `verifier`) — the tool
  result IS the ground truth. Re-running tests to "self-critique" is not
  loop engineering, it's just retry.
- **PM-clarify and other one-shot skills** — no artifact to converge on.

## Cost telemetry

If you want to track how much RCC is costing you on a branch:

```bash
BR="$(git rev-parse --abbrev-ref HEAD)"
for f in .agents/memory/*.jsonl; do
  echo "$f:"
  grep "\"branch\":\"$BR\"" "$f" 2>/dev/null | \
    awk -F'"iteration":' '{split($2, a, ","); print "  iteration " a[1]}'
done
```

If a role is hitting iteration 3 often, its RCC checklist may be too strict
(oscillating) or the upstream spec may be too vague (unfixable in-role).
