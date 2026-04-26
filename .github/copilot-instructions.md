---
name: ai-dev-workflow
description: Multi-agent AI development workflow with structured roles and quality gates
---

# Multi-Agent AI Development Workflow

> This workspace uses a structured four-agent coding pipeline with shared role definitions.
> Reference this guide to understand how to use it with Copilot or other tools.

---

## Overview

This codebase is governed by a **multi-agent development workflow** with four specialized roles:

1. **Architect** — Decomposes tasks into structured implementation plans
2. **Implementer** — Executes plans with expert-level craft
3. **Reviewer** — Provides structured, actionable feedback
4. **Verifier** — Quality gate with 19-point checklist

All role definitions live in `.agents/` and are accessible to any AI tool.

---

## Using with Copilot

### How to Invoke a Role

1. **Get the role definition** from the appropriate file:
   - Architect: `.agents/roles/architect.md`
   - Implementer: `.agents/roles/implementer.md`
   - Reviewer: `.agents/roles/reviewer.md`
   - Verifier: `.agents/roles/verifier.md`

2. **Copy the role definition into your Copilot chat:**
   ```
   Copilot, activate the Architect role as defined in .agents/roles/architect.md:
   [paste the full role definition here]
   
   Now, plan the implementation for: [YOUR TASK]
   ```

3. **Reference the project rules:**
   You can also ask Copilot to read the project's CLAUDE.md file:
   ```
   Before planning, read CLAUDE.md to understand project constraints and conventions.
   ```

---

## Full Pipeline (Recommended)

To run the **full four-phase pipeline** with Copilot:

### Phase 1: Architect

```
Read the role definition from .agents/roles/architect.md.

Now activate that role and plan the implementation for:
[YOUR TASK]

Reference CLAUDE.md for project constraints. Produce output with these sections:
- Summary
- Files to read
- Implementation steps
- Constraints for the Implementer
- Risks
- Open questions
```

**Then wait for approval before moving to Phase 2.**

### Phase 2: Implementer

After the Architect's plan is approved:

```
Read the role definition from .agents/roles/implementer.md.

Now activate that role. Your task is to execute this Architect plan:
[PASTE THE PHASE 1 ARCHITECT OUTPUT HERE]

Execute the plan exactly, step by step. Produce output with these sections:
- Implementation summary
- Files changed
- New files created
- Assumptions made
- Flagged issues
```

### Phase 3: Reviewer

After the Implementer finishes:

```
Read the role definition from .agents/roles/reviewer.md.

Now activate that role. Review this implementation against the Architect's plan and CLAUDE.md:
[PASTE THE PHASE 2 IMPLEMENTER OUTPUT HERE]

Produce a review with these sections:
- CRITICAL — must fix before merge
- RECOMMENDED — should fix
- OPTIONAL — take or leave
- Positives — reinforce these
- Verdict
```

### Phase 4: Verifier

After the Reviewer finishes:

```
Read the role definition from .agents/roles/verifier.md.

Now activate that role. Run the 19-point checklist against:
- Phase 1: Architect's plan
- Phase 2: Implementer's output  
- Phase 3: Reviewer's feedback

[PASTE THE ARCHITECT OUTPUT, IMPLEMENTER OUTPUT, AND REVIEWER OUTPUT]

Produce the checklist with PASS/FAIL for each of the 19 items with evidence.
```

If any item FAILS, provide a prioritized issue list and the Implementer should fix it and re-verify.

---

## Quick Reference: Folder Structure

```
.agents/                          ← Canonical role definitions (source of truth)
  ├── README.md                   (overview and usage guide)
  ├── pipeline.md                 (orchestrator definition)
  └── roles/
      ├── architect.md            (Architect role contract)
      ├── implementer.md          (Implementer role contract)
      ├── reviewer.md             (Reviewer role contract)
      └── verifier.md             (Verifier role contract)

.claude/commands/                 ← Claude Code entry points (delegate to .agents/)
  ├── pipeline.md
  ├── architect.md
  ├── implement.md
  ├── review.md
  └── verify.md

CLAUDE.md                          ← Project identity (auto-loaded by Claude Code)
AGENTS.md                          ← Generic multi-tool entry point (pointer into .agents/)
```

---

## For Claude Code Users

If you're using Claude Code, the workflow is simpler:

```bash
/pipeline Add a FormFieldValidator component to quick-actions
```

Claude Code automatically:
1. Reads CLAUDE.md (project identity)
2. References the roles from `.agents/`
3. Orchestrates the full four-phase pipeline
4. Includes an approval gate between Phase 1 and Phase 2

You can also invoke individual roles:
```
/architect [task]
/implement
/review [files]
/verify
```

---

## Project Rules (CLAUDE.md)

Key constraints to follow:

- **TypeScript:** Strict mode, no `any`, explicit return types
- **React:** Functional components only, custom hooks for logic
- **Styling:** CSS Modules (`.module.css`), no inline styles except dynamic values
- **HTTP:** Shared Axios instance from `src/api/client.ts`, no raw `fetch`
- **Testing:** Co-located `.test.tsx` files, test behavior not implementation
- **File structure:** Feature-based colocation

See `CLAUDE.md` for the full ruleset.

---

## Handoff Flow

```
Task
  ↓
ARCHITECT (reads files, produces plan)
  ↓ [APPROVAL GATE]
IMPLEMENTER (executes plan, produces code)
  ↓
REVIEWER (reviews diff, produces feedback)
  ↓
VERIFIER (checks all against plan)
  ↓ PASS → Done
  ↓ FAIL → back to IMPLEMENTER
```

Each phase builds on the previous one. The pipeline loops between IMPLEMENTER and VERIFIER until quality gate passes.

---

## Tips for Using with Copilot

- **Always include the role definition:** Copy the full `.agents/roles/*.md` file into your chat so Copilot has the exact specification.
- **Reference CLAUDE.md:** Tell Copilot to check project conventions before generating code.
- **Use the structured output formats:** Each role has a required output format in its definition — stick to it for consistency.
- **Paste artifacts between phases:** Copy the labeled output (e.g., "PHASE 1: ARCHITECT OUTPUT") from one phase into the next phase's prompt.
- **Be explicit at gates:** When moving between phases, explicitly tell Copilot which phase you're in.

---

## Questions?

Refer to the role definitions in `.agents/roles/` for full identity, scope, and constraints for each role. The canonical definitions are there — this guide is just an overview.
