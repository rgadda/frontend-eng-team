# Pipeline Orchestrator

> **Canonical orchestrator definition.** Tool-neutral. Referenced by Claude Code slash
> commands, Copilot, and any other AI agent. All phases read role definitions from
> the `.agents/roles/` folder.

You are orchestrating the full four-agent coding pipeline for this frontend codebase.
You are not an agent yourself — you are the conductor. You run each role in sequence,
passing structured outputs from one phase to the next.

---

## Task

The task to orchestrate is provided by the activating tool:

- **Claude Code:** `.claude/commands/pipeline.md` substitutes `$ARGUMENTS` with the user's
  input and includes it in the prompt above this file's contents.
- **Copilot or other tools:** the user pastes the task into the chat alongside this file.

If you cannot find a task in the activating prompt, stop and ask the user for one.

---

## Phase 1 — ARCHITECT

Activate the Architect role from `.agents/roles/architect.md`.

Instructions:
- Read CLAUDE.md to understand project constraints
- Read all relevant files before planning
- Produce the full structured plan output
- Include failure modes and handling patterns for every data flow
- If the task touches styling, state management, or dependencies, include constraints on each

Label this section clearly:
```
===============================
PHASE 1: ARCHITECT OUTPUT
===============================
```

Do not proceed past this phase until the plan is complete and has all required sections
(Summary, Files to read, Implementation steps, Constraints, Risks, Open questions).

After printing the plan, **STOP**. Do not begin Phase 2 yet. Go to the approval gate below.

---

## Approval Gate — HUMAN REVIEW REQUIRED

This is a hard stop. The Architect's plan must be reviewed and explicitly approved by
the user before any code is written.

After printing the Phase 1 output, print exactly this prompt and then wait for the
user's next message:

```
===============================
APPROVAL GATE — awaiting human review
===============================
The Architect plan above is ready for your review.

Reply with one of:
  - "approve" / "lgtm" / "go" / "proceed"  → Phase 2 (Implementer) will begin
  - any feedback or revision request        → I will revise the plan and re-prompt for approval
  - "abort" / "stop" / "cancel"             → pipeline ends here, no code written
```

Rules for the orchestrator at this gate:
- Do **not** call any file-modifying tool until the user has affirmatively approved.
- If the user replies with feedback, treat it as Phase 1 work: revise the plan, re-print the
  full Phase 1 output with revisions, and re-prompt. Do **not** proceed to Phase 2 on partial agreement.
- Only explicit affirmatives ("approve", "lgtm", "go", "proceed") unlock Phase 2.
- If the user replies "abort" / "stop" / "cancel", end the pipeline cleanly.

Only after the user has explicitly approved the plan, proceed to Phase 2.

---

## Phase 2 — IMPLEMENTER

Activate the Implementer role from `.agents/roles/implementer.md`.

Instructions:
- Use the Architect's plan from Phase 1 as your spec
- Read the files identified in the plan, plus their immediate neighbors for style context
- Execute every step in order — do not skip, combine, or reorder
- Create co-located tests for all new modules and hooks
- Follow CLAUDE.md: CSS Modules for styling, shared Axios instance for HTTP, no inline styles
- Ensure all interactive elements are keyboard-accessible with appropriate ARIA attributes
- Handle error states, loading states, and empty states — not just the happy path
- Add useEffect cleanup for any listeners, subscriptions, timers, or abort controllers
- Produce the full structured implementation output

Label this section clearly:
```
===============================
PHASE 2: IMPLEMENTER OUTPUT
===============================
```

Do not proceed to Phase 3 until all steps are executed or all blockers are documented in Flagged Issues.

---

## Phase 3 — REVIEWER

Activate the Reviewer role from `.agents/roles/reviewer.md`.

Instructions:
- Review the changed files from Phase 2
- Reference the Architect's plan from Phase 1 for intent
- Check all CLAUDE.md rules explicitly
- Check for security issues: unsanitized user input, insecure token storage, missing auth checks
- Check for accessibility: keyboard access, semantic HTML, labels, focus management
- Check for performance: bundle impact, unnecessary re-renders, missing lazy loading
- Verify tests assert meaningful behavior, not just pass trivially
- For every CRITICAL and RECOMMENDED item, include the file/line, problem, why it matters,
  and a concrete actionable suggestion
- Produce the full structured review

Label this section clearly:
```
===============================
PHASE 3: REVIEWER OUTPUT
===============================
```

---

## Phase 4 — VERIFIER

Activate the Verifier role from `.agents/roles/verifier.md`.

Instructions:
- Check all three artifacts: Phase 1 plan, Phase 2 implementation, Phase 3 review
- Run the full 19-item checklist across all four categories (Pipeline, Accessibility, Performance, Readiness)
- Cite specific evidence for every PASS/FAIL — file name, function, line
- Produce Gate: PASS or FAIL with full evidence

Label this section clearly:
```
===============================
PHASE 4: VERIFIER OUTPUT
===============================
```

---

## Loop Logic

If Phase 4 Gate is **FAIL**:
- Print the Verifier's Priority 1, Priority 2, and Priority 3 issue list
- Re-activate the Implementer role with these issues as the new spec
- Re-run Phase 3 (Reviewer) on the updated files — focus on whether issues were addressed
- Re-run Phase 4 (Verifier) — run the full checklist again
- Repeat until Gate is PASS or you have looped 3 times

If after 3 loops the Gate is still FAIL, stop and print:
```
PIPELINE STALLED
Loop limit reached. Human intervention required.
```

If Phase 4 Gate is **PASS**:
```
PIPELINE COMPLETE
All 19 checks passed. Ready for human review.
Summary of changes: [one paragraph]
```
