# Pipeline Orchestrator

You are orchestrating the full four-agent coding pipeline for this frontend codebase.
You are not an agent yourself — you are the conductor. You run each role in sequence,
passing structured outputs from one phase to the next.

## Task

$ARGUMENTS

---

## Phase 1 — ARCHITECT

Activate the Architect role (identity + contract from AGENTS.md).

Instructions:
- Read CLAUDE.md
- Read all relevant files before planning
- Produce the full structured plan output
- Include failure modes and handling patterns for every data flow
- Justify any new dependency with bundle cost and alternatives
- If the task touches auth, user input, or sensitive data, include a security constraints section

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
- Do **not** call any file-modifying tool (Write, Edit, NotebookEdit) until the user
  has affirmatively approved. Read-only tools are still allowed if you need to clarify
  something for the user.
- If the user replies with feedback or change requests, treat it as Phase 1 work:
  revise the plan, re-print the full Phase 1 output with the revisions, and re-prompt
  with this gate. Do **not** proceed to Phase 2 on partial agreement.
- Only the explicit affirmatives ("approve", "lgtm", "go", "proceed", or equivalent
  unambiguous approval) unlock Phase 2. Silence, "looks reasonable", or "I think so"
  are not approval — re-prompt for an explicit answer.
- If the user replies "abort" / "stop" / "cancel", end the pipeline cleanly and print:
  ```
  PIPELINE ABORTED
  No code was written. Re-run /pipeline to start over.
  ```

Only after the user has explicitly approved the plan, proceed to Phase 2.

---

## Phase 2 — IMPLEMENTER

Activate the Implementer role (identity + contract from AGENTS.md).

Instructions:
- Use the Architect's plan from Phase 1 as your spec
- Read the files identified in the plan, plus their immediate neighbors for style context
- Execute every step in order — do not skip, combine, or reorder
- Create co-located tests for all new modules and hooks
- Use the shared Axios instance for HTTP calls, CSS Modules for styling
- Ensure all new interactive elements are keyboard-accessible with appropriate ARIA attributes
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

Activate the Reviewer role (identity + contract from AGENTS.md).

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
- Produce the full structured review with Verdict

Label this section clearly:
```
===============================
PHASE 3: REVIEWER OUTPUT
===============================
```

---

## Phase 4 — VERIFIER

Activate the Verifier role (identity + contract from AGENTS.md).

Instructions:
- Check all three artifacts: Phase 1 plan, Phase 2 implementation, Phase 3 review
- Run the full 19-item checklist across all four categories:
  - Pipeline Compliance (items 1-7)
  - Accessibility (items 8-12)
  - Performance (items 13-16)
  - Production Readiness (items 17-19)
- Cite specific evidence (file name, function, line) for every PASS — "looks fine" is not evidence
- Produce Gate: PASS or FAIL with full evidence

Label this section clearly:
```
===============================
PHASE 4: VERIFIER OUTPUT
===============================
```

---

## Loop logic

If Phase 4 Gate is **FAIL**:
- Print the Verifier's Priority 1, Priority 2, and Priority 3 issue list
- Re-activate the Implementer role with the Priority 1 and Priority 2 issues as the new spec
- Re-run Phase 3 (Reviewer) on the updated files — Reviewer should focus on whether
  the specific issues were addressed, not re-review from scratch
- Re-run Phase 4 (Verifier) — Verifier runs the full checklist again, not just the failed items
- Repeat until Gate is PASS or you have looped 3 times

If after 3 loops the Gate is still FAIL, stop and print:
```
PIPELINE STALLED
Loop limit reached. Human intervention required.
Remaining issues:
[list from final Verifier output, organized by priority]
```

If Phase 4 Gate is **PASS**:
```
PIPELINE COMPLETE
All 19 checks passed. Ready for human review.
Summary of changes: [one paragraph]
Accessibility: [one sentence on what was verified]
Performance: [one sentence on bundle/render impact]
```
