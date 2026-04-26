# Agent Role Contracts

> **Source of truth:** All role definitions live in `.agents/roles/`.
> This file is the cross-tool entry point — Claude Code, Copilot, and any other
> AI agent should start here and load the canonical contracts from `.agents/`.

---

## Canonical role definitions

The four roles in the multi-agent pipeline are defined in `.agents/roles/`:

### [Architect](./.agents/roles/architect.md)
- **Purpose:** Decomposes tasks into structured implementation plans
- **Activation:** `/architect` in Claude Code, or load the role file into any other tool
- **Key traits:** Systems thinking, precision, skepticism of complexity

### [Implementer](./.agents/roles/implementer.md)
- **Purpose:** Executes plans with expert-level craft
- **Activation:** `/implement` in Claude Code, or load the role file into any other tool
- **Key traits:** Precision, discipline, production-grade code

### [Reviewer](./.agents/roles/reviewer.md)
- **Purpose:** Provides structured, actionable feedback
- **Activation:** `/review` in Claude Code, or load the role file into any other tool
- **Key traits:** Staff-level review experience, teaching focus

### [Verifier](./.agents/roles/verifier.md)
- **Purpose:** Quality gate with a 20-point checklist
- **Activation:** `/verify` in Claude Code, or load the role file into any other tool
- **Key traits:** Evidence-based verification, production readiness

---

## Pipeline orchestration

The full pipeline is orchestrated in [`.agents/pipeline.md`](./.agents/pipeline.md):

1. **Phase 1 — Architect:** produces the structured plan
2. **Approval gate:** human reviews and explicitly approves the plan
3. **Phase 2 — Implementer:** executes the approved plan
4. **Phase 3 — Reviewer:** provides feedback on the implementation
5. **Phase 4 — Verifier:** runs the 20-item checklist for the final PASS/FAIL gate
6. **Loop:** on FAIL, return to the Implementer with a prioritized issue list

---

## How to activate the agents

### Claude Code

Slash commands are wired to the canonical definitions:

```
/pipeline [task]   # Full pipeline orchestration with approval gate
/architect [task]  # Architect role only
/implement         # Execute the Architect's plan
/review            # Review the Implementer's changes
/verify            # Run the 20-point quality gate
```

Each Claude Code command file in `.claude/commands/` reads the matching `.agents/roles/*.md`
and follows its contract exactly.

### Copilot

See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for the
end-to-end paste-driven workflow. In short:

1. Open the relevant `.agents/roles/<role>.md` file.
2. Paste its contents into the Copilot chat with the directive: "Activate this role and follow its contract."
3. Provide the task (or the prior phase's output) as input.

### Other AI tools

Any tool that supports a project-level instruction file (the `AGENTS.md` convention)
will land here first. Treat this file as a router: load the role files in `.agents/roles/`
and the orchestration in `.agents/pipeline.md`, follow the contracts as written, and
read `CLAUDE.md` for project constraints before producing code.

---

## File map

```
.agents/                          ← Canonical role definitions (source of truth)
  README.md                       (overview and usage guide)
  pipeline.md                     (orchestrator — phases, approval gate, loop logic)
  roles/
    architect.md
    implementer.md
    reviewer.md
    verifier.md

.claude/commands/                 ← Claude Code entry points (delegate to .agents/)
  pipeline.md
  architect.md
  implement.md
  review.md
  verify.md

.github/copilot-instructions.md   ← Copilot entry point (paste workflow for .agents/)

AGENTS.md                         ← This file — generic multi-tool entry point
CLAUDE.md                         ← Project identity, rules, conventions
```

---

## Handoff flow

```
Task → ARCHITECT (reads files, produces plan)
         ↓ [APPROVAL GATE — human review required]
       IMPLEMENTER (executes plan, produces changed files)
         ↓ changed files
       REVIEWER (reviews diff, produces structured feedback)
         ↓ review + implementation
       VERIFIER (runs 20-point checklist against plan + implementation + review)
         ↓ PASS → human approves merge
         ↓ FAIL → back to IMPLEMENTER with priority issue list
```

The loop between VERIFIER and IMPLEMENTER continues until PASS or three iterations.
A human must approve the final PASS before merge.
