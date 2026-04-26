# The Multi-Agent AI Dev Workflow Framework

> A systematic approach to AI-assisted software development that replaces ad-hoc tool usage with a structured, measurable pipeline.

---

## 1. The Problem

Most engineering teams adopted AI coding tools the same way: they bought licenses, distributed them, and hoped for the best. The result is predictable — a few power users get real value, most engineers use AI as a glorified autocomplete, and leadership has no way to measure whether the investment is paying off.

The symptoms are consistent across teams:

- **Inconsistent quality.** AI-generated code varies wildly depending on who prompted it and how. One engineer gets clean, typed components; another gets `any`-riddled spaghetti that passes review because the reviewer is also using AI and skimming.
- **No systematic adoption.** Every engineer has their own setup, their own prompts, their own workflow. There is no shared methodology, no institutional knowledge, no way to onboard new team members into "how we use AI here."
- **Unmeasurable ROI.** Leadership approved the budget because "AI makes developers faster." Six months later, no one can point to a specific metric that improved. PR velocity? Maybe. Code quality? Who knows. Developer satisfaction? Mixed.
- **Context-switching overhead.** Engineers jump between AI tools, manual coding, and review processes with no defined handoff points. The cognitive load of managing AI interactions often offsets the productivity gains.
- **AI drift.** Without guardrails, AI agents make architectural decisions, introduce inconsistent patterns, and slowly degrade codebase coherence. Each AI-assisted PR is locally correct but globally incoherent.

The core issue is not the tools. The tools are capable. The issue is the absence of a *system* — a structured workflow that defines how AI agents operate, what they are and aren't allowed to do, how their work is verified, and how outcomes are measured.

---

## 2. The Multi-Agent Dev Workflow

### Core Concept

Instead of treating AI as a single, general-purpose assistant, this framework assigns AI to **four distinct roles** — each with a defined scope, a structured output format, explicit constraints, and a clear handoff to the next role. The result is a pipeline, not a conversation.

This is the same principle behind any mature engineering process: specialization, separation of concerns, and quality gates. The difference is that AI agents are cheap, fast, and tireless — so you can run the full pipeline on every task, not just the important ones.

### Change-Size Discipline

A pipeline that produces correct code in a 600-line PR has still failed, because reviewer attention degrades non-linearly with PR size — bugs hide in the back half of long diffs, and time-to-merge collapses as PRs grow. This is the failure mode AI assistance most often makes worse: when generating code is cheap, engineers ship larger changes, and review throughput cannot keep up.

The pipeline treats reviewable PR size as a first-class invariant, enforced at every role:

- **Architect** estimates LOC and file count *before* producing the plan. If the work exceeds the budget (≤300 LOC, ≤5 files), the Architect decomposes it into independently shippable phases — each phase becomes its own PR. The plan covers Phase 1 only; subsequent phases get their own pipeline runs.
- **Implementer** halts when execution would push the change beyond the Architect's budget. The remaining steps go into Flagged Issues for a follow-up PR. Silent budget overruns are a contract violation, not a discretionary choice.
- **Reviewer** measures size as the first check. A PR over budget is automatically a CRITICAL finding regardless of code quality, with concrete suggested split points (which files land first, which depend on them).
- **Verifier** has size as a hard checklist item with cited LOC and file count. A budget violation is a FAIL — the gate cannot be opened on quality alone if the diff is unreviewable.

This is why the pipeline produces faster time-to-merge as a *consequence*, not a goal. Smaller PRs review faster. Faster reviews land sooner. Engineers stop waiting on each other. The size discipline is what makes the velocity gains durable rather than borrowed against quality.

### The Four Roles

#### Architect

**When it activates:** At the start of any task — feature, bug fix, or refactor.

**What it does:** Reads the relevant codebase, decomposes the task into a structured implementation plan, identifies risks, flags decisions that require human input, and defines constraints for the next role. The Architect thinks in systems — horizontal scalability (module boundaries that map to team boundaries), vertical scalability (patterns that handle the next order of magnitude without rewrites), and domain-first design (business problem before technology choice).

**What it produces:**
- A summary of the change and its rationale
- A phase budget — estimated LOC and file count, plus phase decomposition if the work exceeds the single-PR budget
- A list of files to read and why
- Ordered implementation steps, each tied to a specific file
- Constraints the Implementer must follow
- Failure modes and handling patterns for every data flow
- Dependency justifications with bundle cost and alternatives
- Security constraints when the change touches auth, user input, or sensitive data
- Risks and open questions

**What it must NOT do:** Write production code. Produce a single-phase plan whose estimate exceeds 300 LOC or 5 files without decomposing it into phases. The Architect plans; it does not build, and it does not bundle multiple PRs' worth of work into one.

**How it makes decisions:** The Architect follows a deliberate decision-making framework:
1. No architecture astronautics — every abstraction must justify its complexity with a concrete current need
2. Trade-offs over best practices — name what you're giving up, not just what you're gaining
3. Reversibility matters — prefer decisions that are easy to change over ones that are optimal but permanent
4. Domain first, technology second — understand the business problem before picking patterns
5. Document decisions, not just designs — the plan captures WHY, so the Implementer can make correct judgment calls at the edges
6. Size for review, not for ambition — fit the work into a reviewable budget by default; if it doesn't fit, decompose into independently shippable phases

**Why this matters:** Most AI-generated code fails not because the code itself is wrong, but because the *approach* is wrong — wrong abstraction, wrong file, wrong scope. The Architect role forces a planning phase that catches architectural mistakes before any code is written. By including failure modes, security constraints, and dependency justifications in the plan, the Architect prevents classes of bugs that code review alone cannot catch — because by the time code exists, the wrong approach is already baked in.

#### Implementer

**When it activates:** After the Architect produces a plan.

**What it does:** Executes the plan step by step with expert-level craft across five dimensions: type-safe code (explicit interfaces, no `any`, aggressive narrowing), performance by construction (bundle-aware imports, compositor-thread animations, virtualized lists), accessible by default (semantic HTML, keyboard navigation, ARIA attributes, focus management), tested alongside (co-located tests written in the same step as the code, not after), and production-complete (error states, loading states, empty states, and effect cleanup handled with the same care as the happy path).

**What it produces:**
- An implementation summary
- A list of changed files with rationale mapped to the plan
- Any new files created and their purpose
- Assumptions made beyond the plan
- Flagged issues (type errors, dependency blockers, accessibility gaps, ambiguities)

**What it must NOT do:** Refactor outside scope, rename things not in the plan, skip tests, make design decisions, use raw `fetch` instead of the shared HTTP client, install unapproved dependencies, or silently exceed the Architect's phase budget. The Implementer is a craftsperson executing a spec, not a creative — and when the spec's budget is reached, the remaining work is deferred to a follow-up PR rather than absorbed into the current one.

**Why this matters:** Unconstrained AI implementations are the primary source of AI drift. The Implementer role eliminates "helpful" refactors, unsanctioned pattern changes, and scope creep. But discipline alone is not enough — the Implementer must also be genuinely skilled. An agent that follows the plan but writes inaccessible components, leaks event listeners, or ignores error states produces code that passes review but fails in production. The Implementer's depth in performance, accessibility, and production readiness is what makes the pipeline output production-grade, not just plan-compliant.

#### Reviewer

**When it activates:** After the Implementer produces changed files.

**What it does:** Reviews like a mentor, not a gatekeeper. The Reviewer assesses the implementation across five dimensions — correctness, security, accessibility, performance, and maintainability — and delivers complete, actionable feedback in a single pass. Every comment teaches the Implementer something: why a pattern is dangerous, why an alternative is stronger, why a seemingly fine approach will break under real-world conditions.

**What it checks specifically:**
- **Size:** Lines changed and files touched against the Architect's budget — a PR over budget is automatically a CRITICAL finding with concrete suggested split points, regardless of code quality
- **Security:** Unsanitized user input, insecure token storage, missing auth checks, `dangerouslySetInnerHTML` without sanitization
- **Accessibility:** Keyboard access, semantic HTML, labels on interactive elements, focus management
- **Performance:** Bundle impact, unnecessary re-renders, missing lazy loading — flagged only when the re-render path or bundle cost is real, not cargo-cult `memo` on everything
- **Test quality:** Tests that pass trivially, mocks that are unrealistically perfect, assertions that don't break when behavior changes
- **Maintainability:** Code that needs the Architect's plan to understand, naming that lies, coupling that will cause pain in 6 months

**What it produces:**
- A size check — LOC changed, files changed, within-budget verdict, and suggested split points if the PR exceeds the budget
- CRITICAL issues (must fix — bugs, type errors, security vulnerabilities, convention violations, size-budget violations)
- RECOMMENDED issues (should fix — accessibility gaps, missing error handling, incomplete tests, performance concerns)
- OPTIONAL issues (take or leave — minor improvements, alternative approaches)
- Positives (patterns done well that the team should repeat)
- A verdict: APPROVE, APPROVE WITH CHANGES, or REQUEST CHANGES

**Every CRITICAL and RECOMMENDED item includes:** the exact file and line/function, what the problem is, why it matters (the consequence if left unfixed), and a concrete suggestion the Implementer can act on immediately.

**What it must NOT do:** Rewrite code (that's the Implementer's job). Flag style preferences as critical. Drip-feed comments across multiple review rounds — the Implementer gets everything at once. Skip the Positives section.

**Why this matters:** AI-assisted code review without structure devolves into either rubber-stamping ("looks good to me") or nitpicking. The Reviewer's one-pass, fully-actionable format means the Implementer can plan all fixes at once and return a complete revision — not a whack-a-mole cycle of "fix one thing, discover three more." The mandatory Positives section calibrates team taste — patterns that get recognized get repeated.

#### Verifier

**When it activates:** After the Reviewer produces feedback.

**What it does:** Runs a 20-item binary checklist against all three prior artifacts — the plan, the implementation, and the review. The Verifier defaults to FAIL and requires overwhelming evidence for PASS. It cannot be charmed, persuaded, or talked into passing. It does not trust prior agents' outputs at face value — if the Reviewer said "APPROVE," the Verifier still runs the full checklist independently. "Looks fine" is never evidence; evidence is a file name, function name, line number, and specific observable behavior.

**What it produces:**
- A PASS/FAIL gate
- A 20-item checklist across four categories, each with cited evidence:

  **Pipeline Compliance (items 1-8):**
  1. Plan coverage — does every Architect step have a corresponding code change?
  2. TypeScript compliance — any `any`, untyped exports, or type errors?
  3. Convention compliance — raw fetch, inline styles, unapproved dependencies, console.log?
  4. Test coverage — does every new module have a co-located test that asserts real behavior?
  5. Critical review items — is every CRITICAL from the Reviewer addressed?
  6. Constraint violations — did the Implementer do anything the Architect forbade?
  7. File structure — are new files in the right location per project conventions?
  8. PR size compliance — does the diff fit the Architect's phase budget (≤300 LOC, ≤5 files unless explicitly authorized with rationale)? Cite actual LOC and file count.

  **Accessibility (items 9-13):**
  9. Keyboard access — can all new interactive elements be reached and operated via keyboard?
  10. Semantic HTML — are buttons, links, nav, dialog used instead of generic divs with handlers?
  11. Labels and names — do form inputs, buttons, and interactive elements have accessible names?
  12. Focus management — do modals trap focus, return focus on close, and handle Escape?
  13. Dynamic announcements — do loading/error/status changes announce to screen readers?

  **Performance (items 14-17):**
  14. Bundle impact — are new dependencies justified? Are dynamic imports used where appropriate?
  15. Render efficiency — no unnecessary re-renders from unrelated context or missing memoization on proven hot paths?
  16. Asset optimization — images have dimensions, lazy loading applied, animations use compositor properties?
  17. Motion respect — does new animation/transition respect prefers-reduced-motion?

  **Production Readiness (items 18-20):**
  18. Error states — does the implementation handle API errors, empty data, and loading states?
  19. Cleanup — are useEffect cleanups present for listeners, subscriptions, timers, and abort controllers?
  20. Security — no dangerouslySetInnerHTML without sanitization, no tokens in localStorage, no secrets in client code?

- On FAIL: a three-tier prioritized issue list for the Implementer (Priority 1: blocking, Priority 2: fix before re-verify, Priority 3: fix if time permits)

**What it must NOT do:** Produce a PASS if any item fails. Add new issues beyond the checklist (that's the Reviewer's job). Give partial credit — each check is binary.

**Why this matters:** The Verifier is what separates this system from "AI with guardrails" and makes it a genuine quality engineering pipeline. Most AI workflows check whether code compiles and tests pass — this one checks whether the code is accessible, performant, secure, reviewable, and production-ready. The 20-item checklist catches what conversational code review misses: the button that's unreachable by keyboard, the animation that ignores motion preferences, the subscription that leaks after unmount, the error state that was never implemented, the 600-line PR that no human will review carefully. A false PASS is the worst output the pipeline can produce — it ships broken code to real users.

### The Pipeline

```
Task
  |
  v
ARCHITECT  ---> reads codebase, produces structured plan with
  |              failure modes, security constraints, dependency justifications
  v
IMPLEMENTER ---> executes plan with craft: accessible, performant,
  |               production-complete code + co-located tests
  v
REVIEWER  ---> one-pass review across security, accessibility,
  |             performance, maintainability — fully actionable feedback
  v
VERIFIER  ---> 20-item checklist across 4 categories with cited evidence
  |
  +---> PASS ---> ready for human review and merge
  |               (includes accessibility + performance summary)
  |
  +---> FAIL ---> prioritized issues sent back to IMPLEMENTER
                  (loop continues until PASS or max 3 retries)
```

**Loop behavior on FAIL:**
1. The Verifier produces a prioritized issue list (Priority 1, 2, 3)
2. The Implementer receives Priority 1 and 2 issues as the new spec
3. The Reviewer re-reviews focused on whether the specific issues were addressed — not a full re-review from scratch
4. The Verifier runs the full 20-item checklist again — not just the previously failed items
5. The loop repeats until PASS or 3 iterations. After 3 failures, the pipeline stalls and escalates to a human with the remaining issue list

### How It's Configured Per Repo

The system uses two configuration files placed in the repository root:

**Project Identity File** — Auto-loaded on every AI session. Defines:
- Tech stack and language rules
- Styling conventions and HTTP client patterns
- Code style non-negotiables (beyond what linters catch)
- File structure conventions
- Testing conventions (unit and E2E)
- Explicit prohibitions ("never do X")
- Communication rules that apply to all roles

**Agent Role Contracts** — Referenced by each slash command. Defines:
- The four role contracts (identity, scope, output format, constraints)
- How roles are activated
- The handoff sequence and loop logic

**Slash Commands** — Each role gets a dedicated command with a two-layer architecture:
- An **identity layer** that defines who the agent is — its expertise, craft standards, and decision-making framework
- A **contract layer** that defines what it does — the specific instructions, checklist items, and output format for this pipeline role

The commands:
- `/architect <task>` — activates the Architect with scalability, security, and failure-mode thinking
- `/implement` — activates the Implementer with craft standards for accessibility, performance, and production readiness
- `/review` — activates the Reviewer with one-pass, fully-actionable, security-and-accessibility-aware review
- `/verify` — activates the Verifier with the full 20-item checklist across 4 quality categories
- `/pipeline <task>` — orchestrates the full sequence with loop-on-failure and scoped re-review

This per-repo configuration is what makes the system scalable. Each repository can have its own rules, constraints, and conventions — but the pipeline structure remains consistent across the organization. The identity/contract separation also means teams can update an agent's expertise (identity layer) without touching the pipeline mechanics (contract layer), and vice versa.

### Human Judgment Checkpoints

The system is not fully autonomous. Human judgment intervenes at specific points:

1. **Before the Architect starts:** A human defines the task. The quality of the input determines the quality of the pipeline output.
2. **After the Architect plans:** For high-risk changes, a human reviews the plan before the Implementer executes. This catches wrong-direction work before any code is written.
3. **After the Verifier passes:** A human approves the final output before merge. The pipeline makes this review fast and trustworthy — the human is reviewing verified, structured output, not raw AI code.
4. **On pipeline stall:** If the Verifier fails after 3 loops, the system stops and escalates to a human with a specific issue list. It does not retry indefinitely.

These checkpoints prevent the most dangerous failure mode of AI-assisted development: *unsupervised drift at scale.*

---

## 3. Cognitive Sustainability

### Why DevEx Determines AI Adoption

The conventional pitch for AI dev tools is productivity: "Your engineers will ship faster." This is true but incomplete. The actual bottleneck to AI adoption is not capability — it's cognitive load.

Engineers who adopt AI tools without a system report a consistent pattern:

1. **Initial excitement.** AI autocomplete feels magical. Boilerplate disappears. Simple tasks are instant.
2. **Plateau.** The easy gains are captured. For complex tasks, the engineer spends as much time reviewing and correcting AI output as they would have spent writing the code themselves.
3. **Frustration.** The engineer now manages two workflows — their original one and the AI one. Context-switching between "writing code" and "supervising AI" becomes exhausting.
4. **Quiet abandonment.** The engineer stops using AI for anything beyond autocomplete. The license cost remains; the value evaporates.

This is not a tool problem. It's a workflow design problem. The multi-agent pipeline solves it by aligning AI usage with how engineers already think about work.

### Flow-State Preservation

The pipeline's role separation directly supports engineering flow states:

- **When architecting:** The engineer thinks in systems — interfaces, contracts, data flow. The Architect role matches this mental mode. The engineer evaluates a plan, not code.
- **When implementing:** The engineer thinks in execution — syntax, patterns, tests. The Implementer role matches this mode. The engineer reviews executed steps against a known spec.
- **When reviewing:** The engineer thinks in critique — correctness, standards, edge cases. The Reviewer role matches this mode. The structured severity tiers prevent review fatigue.
- **When verifying:** The engineer makes binary decisions — pass or fail. The Verifier role eliminates ambiguity. No judgment calls, just evidence.

Each role requires a single cognitive mode. The engineer never needs to simultaneously architect, implement, and review — which is what happens when AI is used as a general-purpose assistant.

### The Cognitive Load Budget

Every engineering team has a finite cognitive load budget. AI tools either consume budget or free it.

**AI that consumes cognitive load:**
- Unpredictable output formats that require different review strategies each time
- No separation between "AI is planning" and "AI is coding" — the engineer must constantly assess which mode they're in
- No quality gates — the engineer must manually verify everything, every time
- Inconsistent patterns across the codebase because each engineer prompts differently

**AI that frees cognitive load:**
- Structured, predictable outputs — the engineer knows exactly what they're reviewing and where to look
- Clear role boundaries — the engineer matches their cognitive mode to the current pipeline phase
- Automated quality gates — the Verifier catches mechanical issues so the human reviewer focuses on intent and architecture
- Consistent patterns — the project identity file ensures all AI output matches the codebase voice

The multi-agent pipeline is designed to be a net *reducer* of cognitive load, not an addition to it. This is why adoption sustains — engineers keep using it because it makes their work easier, not because management mandated it.

---

## 4. Implementation Checklist

### Prerequisites

Before implementing this system, verify:

- [ ] **AI tool access:** Team has licenses for an AI coding assistant that supports custom system prompts and project-level configuration (e.g., Claude Code, Cursor, or similar)
- [ ] **Repository structure:** Repos follow a consistent file structure convention (feature-based, domain-based, or layer-based — the system adapts to any)
- [ ] **Team size:** 5+ engineers. Below 5, the overhead of the system exceeds the coordination benefit.
- [ ] **Existing standards:** The team has *some* coding standards, even informal ones. The system codifies standards — it doesn't create them from scratch.
- [ ] **Engineering leadership buy-in:** At least the tech lead or EM supports the rollout. Bottom-up adoption works for individual use; the pipeline requires team-level alignment.

### Setup Steps Per Repository

**Phase 1: Project Identity (1-2 hours)**

- [ ] Create the project identity file at the repo root
- [ ] Document the tech stack with specific versions and constraints
- [ ] List code style rules that go beyond linter configuration — the judgment calls
- [ ] Document any active migrations (e.g., design system, framework version, API patterns) with explicit "use this, not that" tables
- [ ] Define file structure conventions with an example tree
- [ ] List testing conventions: what to test, how to mock, where tests live
- [ ] Write the "never do" list — things that are technically valid but organizationally wrong
- [ ] Define communication rules for AI output (architecture before code, flag assumptions, surface trade-offs)

**Phase 2: Agent Role Contracts (1-2 hours)**

- [ ] Define the four roles (Architect, Implementer, Reviewer, Verifier) with:
  - Identity: who this agent is and how it thinks
  - Scope: what it does and doesn't do
  - Output format: structured template with required sections
  - Constraints: explicit prohibitions
- [ ] Define the handoff sequence and loop logic
- [ ] Define the pipeline stall condition (max retries before human escalation)

**Phase 3: Slash Commands (1 hour)**

- [ ] Create a command file for each role
- [ ] Each command should have an identity layer (persona) and a contract layer (scope + output format)
- [ ] Create the pipeline orchestrator command that runs all four in sequence
- [ ] Test each command with a small, representative task

**Phase 4: Team Onboarding (2 hours)**

- [ ] Walk the team through the system in a live session (not a doc dump)
- [ ] Run a live demo: take a real task from the backlog and run it through the pipeline
- [ ] Pair with each engineer on their first pipeline run
- [ ] Collect feedback after 1 week and adjust the project identity file based on what's working

### Estimated Total Setup Time

| Activity | Time | Who |
|---|---|---|
| Project identity file | 1-2 hrs | Tech lead |
| Agent role contracts | 1-2 hrs | Tech lead |
| Slash commands | 1 hr | Tech lead |
| Team onboarding session | 2 hrs | Tech lead + team |
| First-week feedback loop | 1 hr | Tech lead |
| **Total** | **6-8 hrs** | — |

After initial setup, ongoing maintenance is minimal — the project identity file gets updated when the stack changes, and the role contracts get refined based on team feedback. Most teams stabilize within 2-3 weeks.

---

## 5. Measurement

### Why Measurement Matters

Without measurement, AI tool adoption is a faith-based initiative. Leadership can't justify renewals, engineers can't demonstrate improvement, and no one knows if the system is actually working or just feels like it is.

The measurement framework has two layers: **quantitative metrics** (what can be counted) and **qualitative signals** (what can be observed).

### Quantitative Metrics

#### Velocity Metrics

| Metric | What It Measures | How to Collect | Baseline Period |
|---|---|---|---|
| PRs merged per engineer per week | Raw throughput | Git/GitHub analytics | 2-4 weeks pre-adoption |
| Time from PR open to merge (median + P90) | Review cycle efficiency — P90 surfaces the long-tail PRs that block release cuts | Git/GitHub analytics | 2-4 weeks pre-adoption |
| Time from task assignment to first PR | Planning-to-execution speed | Project management tool | 2-4 weeks pre-adoption |
| Lines of code per PR (median + average) | Whether PRs are getting appropriately sized — track median and average together; divergence signals a few large outliers dragging the average | Git analytics | 2-4 weeks pre-adoption |
| % of PRs within size budget (≤300 LOC, ≤5 files) | Whether the size discipline is holding — this is the leading indicator for time-to-merge improvements | Git analytics | 2-4 weeks pre-adoption |

#### Quality Metrics

| Metric | What It Measures | How to Collect | Baseline Period |
|---|---|---|---|
| Review comments per PR | Review depth and catch rate | GitHub/GitLab analytics | 2-4 weeks pre-adoption |
| Post-merge bug rate | Whether AI-assisted code is production-stable | Bug tracker correlation | 4-8 weeks pre-adoption |
| Type error rate in CI | Codebase type safety over time | CI logs | 2-4 weeks pre-adoption |
| Test coverage delta | Whether new code includes tests | CI coverage reports | Snapshot at adoption start |
| Reverts per sprint | How often AI-assisted changes need rollback | Git history | 4-8 weeks pre-adoption |

#### Adoption Metrics

| Metric | What It Measures | How to Collect | Target |
|---|---|---|---|
| Pipeline runs per week (team) | System usage frequency | Command/session logs | Increasing for first 4 weeks |
| Repos with project identity files | System coverage | File search across repos | 100% of active repos within 4 weeks |
| Verifier pass rate on first attempt | Pipeline efficiency / plan quality | Pipeline output logs | >70% after first month |
| Engineers actively using pipeline | Individual adoption | Self-report or session logs | >80% of team within 3 weeks |

### Qualitative Signals

These are observed, not counted. Track them through weekly check-ins or async surveys.

| Signal | What to Look For | Collection Method |
|---|---|---|
| Developer satisfaction | "Do you feel more productive?" vs. "Do you feel more busy?" | Anonymous survey (biweekly) |
| Review confidence | "Do you trust AI-assisted PRs as much as manually-written ones?" | 1:1 check-ins |
| Cognitive load | "Does the pipeline reduce or add mental overhead?" | Anonymous survey |
| Workflow consistency | Are engineers following the pipeline, or reverting to ad-hoc AI usage? | Observation + retrospectives |
| Onboarding speed | Can a new team member run the pipeline on day 1? | Onboarding feedback |

### Reporting Cadence

| When | What | Audience |
|---|---|---|
| Week 1 (baseline) | Pre-adoption metric snapshot | Tech lead |
| Week 3 (early signal) | First velocity + adoption comparison | Tech lead + EM |
| Week 6 (trend) | Full metric comparison + qualitative feedback | Tech lead + EM + leadership |
| Monthly (ongoing) | Dashboard or report with all metrics | Engineering leadership |

### How to Frame Results

When reporting outcomes, lead with business impact, not technical process:

- **Instead of:** "We implemented a 4-role AI agent pipeline with per-repo config files"
- **Say:** "PR review cycle time dropped from 26 hours to 8 hours, and post-merge bug rate decreased by 40%"

- **Instead of:** "80% of engineers are using the pipeline"
- **Say:** "Engineering throughput increased 2x with no additional headcount, while maintaining quality standards"

- **Instead of:** "The Verifier catches issues before human review"
- **Say:** "Human reviewers now spend 60% less time on mechanical checks and focus on architecture and intent"

The measurement framework exists to prove value in the language that justifies continued investment.
