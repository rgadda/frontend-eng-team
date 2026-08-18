# PM Clarify — Claude Code Command

> **Backing skill:** `plugins/frontend-team/skills/pm-clarify/`
>
> This command lets a developer or tester ask a clarifying question about the
> current feature without pulling the human PM in. The skill answers from the
> approved `branch-prd.md` and prior clarifications when possible, and drafts a
> question for the human PM when it cannot.

---

## Question

$ARGUMENTS

---

## Instructions

1. **Invoke the `pm-clarify` skill.** All logic lives in the skill; this command
   is a thin entry point.
2. The skill will:
   a. Read `branch-prd.md` at the project root (fail fast if missing — no PRD
      means no feature in flight to clarify).
   b. Grep `.agents/memory/clarifications.jsonl` for the current branch to check
      whether this or a similar question has already been answered.
   c. Answer the question grounded in the PRD's acceptance criteria, scope, and
      constraints when possible.
   d. If the PRD does not cover the question, draft a clean question for the
      human PM and mark the record as `status: "escalated"`.
   e. Append a new record to `.agents/memory/clarifications.jsonl` so future
      questions on the same branch dedupe against it.
3. Return one of two outputs (see the skill for the exact templates):
   - **Answered from PRD** — quotes the PRD line(s) that resolve the question.
   - **Escalated to human PM** — a copy-pastable question the dev/tester can
     take to the human PM, with the ambiguity precisely named.

If `branch-prd.md` does not exist, stop and tell the user there is no PRD for
this branch — either the task is not a feature (in which case ask the Architect
or Implementer directly), or `/pm` has not been run yet.
