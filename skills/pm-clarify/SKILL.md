---
name: pm-clarify
description: Load this when a developer or tester has a clarifying question about the current feature in flight. Reads branch-prd.md and prior clarifications in .agents/memory/clarifications.jsonl, then either answers grounded in the PRD or drafts a clean question for the human PM. Triggers — "clarify", "what does the PRD say", "is this in scope", "PM question", "acceptance criteria for", "/pm-clarify".
---

# PM Clarify — playbook

Apply this when a dev or tester asks a scope / acceptance-criteria / intent
question during implementation or testing. The goal is to answer without pulling
the human PM in unless the PRD genuinely does not cover it.

## Preconditions

- `branch-prd.md` MUST exist at project root. If it does not, stop and tell the
  user: "No PRD on this branch. Either the task is a bug/refactor (in which
  case ask the Architect or Implementer directly), or `/pm` has not been run
  yet."
- The current branch's `branch-prd.md` YAML header `branch:` field must match
  `git rev-parse --abbrev-ref HEAD`. If it does not, the PRD is stale — flag
  it and offer to re-run `/pm` before answering.

## Steps

### 1. Dedupe against prior clarifications

Grep the memory JSONL for this branch first — the same or a similar question
may have been answered already, and it is cheaper to reuse than re-answer.

```bash
BR="$(git rev-parse --abbrev-ref HEAD)"
grep "\"branch\":\"$BR\"" .agents/memory/clarifications.jsonl 2>/dev/null | tail -10
```

If a prior record's `summary` clearly answers this question, cite it in the
response and skip to step 4 (write a new record referencing the prior one, so
the dedupe chain stays intact).

### 2. Search the PRD

Read the relevant sections of `branch-prd.md`:

- **Acceptance criteria** — most questions live here.
- **Scope — in** and **Scope — out** — for "is X in scope?" questions.
- **Constraints for the Architect** — for questions about non-negotiables.
- **Success metrics** — for "how do we know this works?" questions.

Grep first with the question's key nouns to locate the right section rather
than reading the whole PRD.

### 3. Answer or escalate

**If the PRD answers the question:**
- Quote the specific line(s) from the PRD.
- Give the direct answer in one sentence.
- Note the section the quote came from ("Acceptance criteria #3", "Scope —
  out bullet 2").

**If the PRD does not answer the question:**
- Draft a clean, PM-ready question. State the ambiguity precisely: what the
  PRD says, what it does not say, and what decision hinges on the answer.
- Do NOT invent an answer. Do NOT ask the Architect to decide product intent.
- Tag the response `ESCALATED` so the dev/tester knows to actually take the
  question to the human PM.

### 4. Write the memory record

Always append a record, whether answered or escalated. Future questions on the
same branch dedupe against this.

```bash
.agents/memory/append.sh clarifications.jsonl pm_clarify 1 \
  <answered|escalated> \
  "<one-paragraph summary: the question, and either the PRD-grounded answer or the escalation reason>" \
  --task "<the original PRD task string if you have it, else the question>" \
  --tags "type:feature" \
  --decisions "Source: <PRD section> | Verdict: <answered|escalated>"
```

If `append.sh` fails, print a one-line warning and continue.

## Response templates

### Answered from PRD

```
## Answered from PRD

**Question:** <the dev's question>

**Answer:** <one sentence>

**PRD source:** `branch-prd.md` — <section name>
> <exact quoted line(s)>

**Confidence:** high (grounded in acceptance criterion / scope statement)
```

### Escalated to human PM

```
## Escalated — needs the human PM

**Question:** <the dev's question>

**Why escalating:** The PRD covers <what it does cover> but does not specify
<the exact missing bit>. This is a product decision, not a technical one.

**Draft to send to the human PM (copy-paste ready):**
> On `<branch>`, working the <feature name> feature, the PRD is ambiguous on
> <the specific ambiguity>. Acceptance criterion #<n> says <quote>, but does
> not say what should happen when <the edge case>. Which of the following do
> you want:
> - Option A: <one line>
> - Option B: <one line>
> - Other: <blank>

**Once you have the answer, either:**
- Re-run `/pm` so the PRD reflects the new decision, OR
- Re-run `/pm-clarify` with the answer so it is captured in memory for the rest of the team.
```

## Cost note

This skill runs in the main context — no subagent fork. It is the cheapest
possible implementation. Do not spawn agents from within this skill. If the
question requires deep codebase exploration (rare for a PRD clarification),
suggest the `repo-explorer` subagent explicitly and stop.
