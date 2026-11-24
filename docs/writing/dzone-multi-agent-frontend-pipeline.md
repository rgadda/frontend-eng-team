# Multi-Agent Pipelines for Frontend Work: A Data-Driven Look at Defect Catch vs. Token Cost

*How a four-role AI pipeline earns its overhead on real React features — plus a lite variant for the changes that don't need the full gate.*

---

## The premise

Most engineers using AI coding assistants today are doing so ad-hoc: paste a prompt, take the code, ship it. The results are uneven. On a good day, the AI gives you production-ready output. On a bad day, it invents an API that doesn't exist, drops a `useEffect` cleanup, or ships an inaccessible input. There's no floor and no ceiling.

A multi-agent pipeline is one response. Instead of asking a single AI instance to design, implement, review, and verify a change, you separate concerns across specialized roles — each with its own contract, its own inspection depth, and its own cost profile.

The obvious objection: **you're paying for tokens four times over.** Does the extra spend catch enough real defects to justify itself? And when it doesn't, is there a cheaper tier that still beats ad-hoc?

We ran a controlled A/B experiment on four React features of increasing complexity to answer the first question. Then we built a lite pipeline to answer the second.

---

## The experiment

We picked four React tasks spanning a 10× size range:

1. **Toggle component** (~80 LOC) — an accessible on/off switch with controlled state.
2. **useDebounce hook + SearchBox component** (~170 LOC) — a generic hook and a component that consumes it.
3. **NotificationBanner** (~280 LOC) — dismissible banner with variants, auto-dismiss, live regions.
4. **Toast notification system** (~750 LOC) — Context provider, custom hook, portal-based container, individual toast with hover-pause auto-dismiss, and a queue.

For each task, we ran two arms:

- **Arm A (monolithic):** a single AI agent instance was asked to design, implement, self-review, and self-verify the feature end-to-end. Given the full conventions bar (TypeScript strict, functional React, CSS Modules, `prefers-reduced-motion` on transitions, accessibility baseline, no `any`, no missing `useEffect` cleanup) up front.
- **Arm B (pipeline):** four sequential specialized sub-agent invocations — an Architect (produces a compact plan), an Implementer (writes code against the plan), a Reviewer (audits the diff against convention checks), a Verifier (final PASS/FAIL gate with a 25-item checklist).

Both arms wrote real code files. Both were measured by the actual `total_tokens` reported by the AI runtime. Both were judged by the same convention bar. The framework's role definitions live in plain markdown files — this is not tied to any single AI vendor.

---

## The headline number

| Task | Size | Arm A (monolithic) | Arm B (pipeline) | Ratio | Defects Arm A shipped as PASS |
|---|---:|---:|---:|---:|---|
| 1 — Toggle | ~80 LOC | 21,133 tokens | 59,114 tokens | 2.80× | Missing `prefers-reduced-motion` guard |
| 2 — useDebounce + SearchBox | ~170 LOC | 23,659 | 54,856 | 2.32× | Unstable callback in effect deps + missing accessible name |
| 3 — NotificationBanner | ~280 LOC | 23,888 | 57,729 | 2.42× | Side-effect inside `setState` updater (StrictMode hazard) |
| 4 — Toast system | ~750 LOC | 37,185 | 88,658 | 2.38× | Timer re-arm on every enqueue + StrictMode-permanent-disable of auto-dismiss + missing unmount test |
| **Total** | **~1,280 LOC** | **105,865** | **260,357** | **2.46×** | **6 real defects** |

The pipeline costs roughly **2.5× more tokens** than a single-agent approach. In exchange, it caught **six real defects** the single-agent approach declared green.

Not style nits. Actual correctness bugs, WCAG failures, and — on the largest task — a silent React 18 timer bug that would have shipped and only surfaced under real user load. At current API rates, the extra tokens cost a few dollars per feature. Compare that to the cost of a shipped defect. The economics are lopsided.

---

## What surprised us

Going in, our hypothesis was that the ratio would **inverse** at scale. The intuition: a monolithic prompt drags full context into every self-critique iteration, growing quadratically as tasks get bigger. A pipeline's per-role contexts stay bounded via memory summaries. So on a 750-LOC feature, the pipeline should be *cheaper*, not more expensive.

That's not what happened. The ratio held remarkably flat: 2.80 → 2.32 → 2.42 → 2.38.

**Why the prediction was wrong:** the monolithic arm doesn't actually iterate. It writes the code, does a shallow self-review, declares PASS, and stops. There is no compounding. The quadratic-cost story assumed the monolithic prompt would behave rigorously; in practice, it optimizes for finishing.

That flat ratio is itself the finding: **cost per LOC stays proportional across scales, but defect-catch capacity diverges dramatically.**

Both arms get roughly **5× cheaper per LOC** as tasks scale from 80 → 750 LOC. Fixed sub-agent overhead is amortized. The pipeline's per-LOC cost on a 750-LOC feature (118 tokens/LOC) is lower than the monolithic's per-LOC cost on an 80-LOC feature (264 tokens/LOC). Do not fear the framework on large features — it's actually where it shines economically.

---

## Where the value comes from (per-role economics)

Not every role in the pipeline earns its keep equally. The data:

| Role | Avg tokens per run | Defects caught (of 4 tasks) | Value density |
|---|---:|---:|---|
| Architect (planner) | ~11K | 1 meta-catch (test-runner mismatch, missing infra) | High — proactive, cheap |
| Implementer | ~22K | 0 (writes code, doesn't audit) | Necessary but not a gate |
| **Reviewer** | **~10K** | **3 CRITICALs (tasks 2, 3, 4)** | **Highest by far** |
| Verifier | ~22K | 4 (confirmed Reviewer + solo catch on Task 1) | High but expensive |

**The Reviewer is the framework's best-kept secret.** Cheapest gate in the system, highest per-token catch rate. If you add one thing to an ad-hoc AI workflow, add the Reviewer. It catches things a monolithic self-review reliably misses.

The Verifier is the deepest gate — it uses actual inspection tools (grep, file reads, and in a live project, `tsc --noEmit` + `eslint` + `vite build`) — but at ~22K tokens per run, it's the most expensive. The data suggests it earns its keep on stateful, multi-file features. It's overkill for a static button.

**This uneven cost/value distribution is what motivated the lite pipeline.**

---

## The lite pipeline: a second tier for small work

The Reviewer earns its cost. The Verifier earns its cost on complex features but not on trivial ones. So we built a **lite pipeline** — `/pipeline-lite` — that runs Implementer → Reviewer only, skipping Architect, Verifier, prod-readiness, approval gates, and the outer FAIL loop.

Target run cost: ≤25K tokens end-to-end (vs. 50–90K for the full pipeline). Same code quality bar on the essentials (no `any`, no raw `fetch`, no missing `useEffect` cleanup, accessible names, `prefers-reduced-motion` guards, security basics), just enforced by a tighter checklist.

Three design decisions keep the tier honest:

1. **A hard entry gate.** Any task mentioning `auth`, `login`, `token`, `payment`, `PII`, `sanitiz`, `webhook`, `cookie`, or similar sensitive keywords is rejected before Phase 1 runs. The user has to either re-run with `/pipeline` or explicitly type `override` to bypass. Lite mode fails closed on the wrong tasks.
2. **Compressed, self-contained role files.** `implementer-lite.md` and `reviewer-lite.md` live alongside the base contracts as separate ~60-LOC files. Sub-agents load the compact version only, so the token savings are real per invocation, not just theoretical.
3. **Escalation is one command away.** If the Reviewer surfaces a CRITICAL that the compressed checklist can't resolve, the user gets a four-choice menu: `fix` (re-run Implementer-lite, capped at 2 iterations), `escalate` (stop; re-run with full `/pipeline`), `merge` (accept and merge, logged as `lite:true,override:true`), or `abort`. No dead ends.

Use it for one-file bugfixes, CSS-only work, copy tweaks, config edits, and well-established patterns with low blast radius. Use the full `/pipeline` for anything else.

---

## Case study: what the full pipeline caught on the Toast system

Task 4 was the largest and most architecturally interesting: a Context provider + custom hook + portal-based container + individual `<Toast />` component with per-toast timer, hover/focus pause, queue management, and a `maxVisible` overflow policy.

The monolithic arm declared PASS on all ten of its self-verification buckets. The full pipeline's Verifier failed the change on two subtle React 18 bugs — both invisible to skim-review.

**Bug 1: timer re-arms on every enqueue.** The provider used `useMemo` to build the context value, with `state.visible` in the dep array. Every time a new toast was enqueued, `state.visible` mutated, `useMemo` recreated the context object, and `ctx.dismiss` was read as a new function reference on the child side. That new reference propagated through the child's `useCallback` chain and re-fired the auto-dismiss `useEffect` — **every existing toast's timer reset to full original duration.** In casual testing this is invisible; under real user load, toasts never disappear.

**Bug 2: StrictMode double-mount permanently disables auto-dismiss.** The Toast used a `mountedRef` guard set to `false` in cleanup — but never reset to `true` on remount. React 18 StrictMode's synthetic double-mount in development means `mountedRef.current` is permanently `false` after the first cleanup, so the timer's callback silently does nothing.

Neither bug throws. Neither shows up in a linter. Both require understanding `useMemo` identity semantics, callback dependency chains, and StrictMode lifecycle. This is exactly the kind of thing a specialized Verifier, prompted to look for these hazard patterns with real inspection tools, is designed to catch — and exactly the kind of thing the lite pipeline would (correctly) not attempt on features of this shape.

Total pipeline overhead on Task 4: ~51K extra tokens vs. the monolithic run. A few dollars of API spend for two silent-in-production React 18 bugs.

---

## The honest counterpoint

The pipeline is not universally better. On Task 3 (NotificationBanner), the pipeline **regressed** on a dimension the monolithic arm got right: the pipeline's Implementer hardcoded 16 hex color literals directly in CSS, where the monolithic arm used `var(--color-info-bg, <fallback>)` throughout.

Different roles have different blind spots. **The pipeline works because of redundancy, not because any single role is infallible.** A PASS from any single role is a check, not a proof.

---

## How to use both pipelines efficiently

**Rule 1 — Default to `/pipeline-lite` for small work; `/pipeline` for everything else.** ≤200 LOC, ≤3 files, no sensitive paths, well-established pattern → lite. Anything touching Context / hooks / effects / portals, any `sensitive:*` concern, any feature with new user flows → full pipeline.

**Rule 2 — Respect the per-phase budget (≤300 LOC / ≤5 files) on the full pipeline.** Overrides produce measurable quality regressions. Split into phases; let the Architect do it for you.

**Rule 3 — Feed your conventions to ad-hoc AI too, not just the pipeline.** The monolithic arm in our experiment was a *best-case* monolithic — it received the full conventions bar in the prompt. Real-world ad-hoc AI use rarely does this. Even without adopting a pipeline, prepending your team's convention file catches an enormous class of drift.

**Rule 4 — Trust redundancy, not individual roles.** Value comes from disagreement between roles. Design your process to surface disagreements, not to hide them behind a rubber-stamp PASS.

**Rule 5 — Use cheaper models for read-only roles.** Reviewer, prod-readiness checkers, repo-explorers, and test-runners do pattern-matching against readable code. A smaller model handles this at roughly a third the cost. Reserve the frontier model for roles that need judgment (Architect, Verifier).

**Rule 6 — Any pipeline is a floor, not a ceiling.** Pipeline PASS ≠ merge-ready. Human review still catches business-logic bugs, product intent, and UX issues no gate can. Sell the framework internally as pre-review filtering, not review replacement.

**Rule 7 — Start with one loud role, not the full pipeline.** Adoption failure mode: team is told to use the full pipeline from day one, it feels heavy, they abandon it. Better path: run just the Reviewer (or `/pipeline-lite`) on every small PR for two weeks. Prove value cheaply. Add the full `/pipeline` on features. Add prod-readiness on sensitive changes.

---

## Known gaps we're closing

Two concrete gaps the data exposed, ranked by impact:

**1. Per-role model tier defaults.** Wiring the Reviewer sub-agent to explicitly request a smaller model (which the plugin config already supports) would cut Reviewer cost roughly in half. Same for prod-readiness and repo-explorer. Total pipeline cost drops ~15%.

**2. Cost telemetry surfaced mid-run.** The framework stores per-phase token counts in a memory ledger, but users can't see the running cost until the pipeline finishes. A one-line `"phase-3-reviewer: +8,286 tokens (branch total: 32,715)"` printed after every phase would massively improve users' ability to make informed skip decisions between the full and lite pipelines. Trivial to add.

(A third gap — formalizing the Reviewer-only mode — was the direct motivation for the lite pipeline described above.)

---

## The bottom line

Multi-agent pipelines are not free. In our four-task experiment, the full pipeline cost roughly 2.5× more tokens than a single-agent approach. That ratio held stable across a 10× range in feature size — the "quadratic cost blowup at scale" story we started with was wrong.

But the full pipeline caught six real defects across four tasks that the single-agent approach shipped as green. Two were silent React 18 correctness bugs on the largest task, invisible to skim-review, expensive to debug after ship. **The value is not cost — the value is defect-catching capacity that scales with code complexity.**

For the changes where that capacity is overkill, the lite pipeline runs the Reviewer alone at ~55% lower cost, with a hard sensitivity gate that fails closed on the wrong tasks. Two tiers, one framework, one decision the user makes at the moment they type the slash command.

The framework is intentionally simple: a set of role definitions in markdown, two pipeline orchestrators, and a compact memory format. It runs on any AI coding assistant that can load context files. There is no vendor lock-in, no hosted service to buy, no proprietary runtime.

Try `/pipeline-lite` on your next small PR. If it catches something you'd have shipped, you've already earned back a week of tokens.

---

*The full and lite pipelines, role definitions, and bootstrap script are open. The four-task experiment described above is reproducible — task specs, per-phase prompts, code output, and raw token counts are preserved for anyone who wants to run their own comparison.*
