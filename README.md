# Frontend AI Pipeline — Setup Guide

## File Map

```
repo-root/
│
├── CLAUDE.md                        <- Auto-loaded by Claude Code on every session
│                                      Project identity: stack, rules, constraints
│
├── AGENTS.md                        <- Role contracts for all four agents
│                                      Referenced by every slash command
│
├── framework.md                     <- The multi-agent methodology document
│
├── metrics-collection.md            <- What metrics to collect and how
│
└── .claude/
    └── commands/
        ├── architect.md             <- /architect <task description>
        ├── implement.md             <- /implement (uses Architect output as context)
        ├── review.md                <- /review (uses changed files as context)
        ├── verify.md                <- /verify (uses plan + impl + review as context)
        └── pipeline.md             <- /pipeline <task> (full orchestrated run)
```

---

## How Claude Code loads these files

**CLAUDE.md** is automatically read by Claude Code at session start. No invocation needed.
It sets the project identity for every agent session in this repo.

**AGENTS.md** is not auto-loaded — it is referenced by each slash command explicitly.
This keeps it out of the context window unless a role is being activated.

**`.claude/commands/`** files become slash commands in Claude Code.
Type `/architect`, `/implement`, etc. directly in the Claude Code interface.

---

## Tech Stack

This template is configured for a frontend team using:

| Tool | Purpose |
|---|---|
| React 18 | UI framework (functional components only) |
| TypeScript 5 | Language (strict mode, no `any`) |
| Vite | Build tooling |
| CSS Modules | Component-scoped styling |
| Axios | HTTP client (centralized instance) |
| Jest + React Testing Library | Unit testing |
| Playwright | E2E testing |
| ESLint + Prettier | Linting and formatting |

---

## Usage patterns

### Full pipeline (recommended for new features)
```
/pipeline Add a UserProfile component to the settings feature
          that fetches user data via Axios and displays it
          with editable fields and form validation
```

### Role by role (recommended when you want to inspect each phase)
```
# Step 1
/architect Add a UserProfile component to the settings feature

# Step 2 — paste or reference Architect output
/implement

# Step 3
/review

# Step 4
/verify
```

### Quick implementation (for small, low-risk tasks)
```
/implement Fix the TypeScript error in src/features/settings/SettingsPanel.tsx
           line 47 — the onSelect prop is typed as any
```

---

## Adapting This Template

This is a generic frontend team template. To adapt it for your project:

1. **CLAUDE.md** — Update the tech stack table, styling conventions, and "never do" list to match your project's actual stack and standards.
2. **AGENTS.md** — The role contracts are stack-agnostic. Adjust the Verifier checklist if your project has specific compliance requirements (e.g., accessibility, i18n).
3. **Slash commands** — Update the identity layers to reflect your stack. The contract layers are stable and rarely need changes.
4. **Test the pipeline** — Run `/pipeline` on a small, real task from your backlog to validate the setup before team rollout.

---

## Maintenance

| File | Who owns it | When to update |
|---|---|---|
| CLAUDE.md | Tech lead | Stack changes, new conventions, new dependencies |
| AGENTS.md | Tech lead | Pipeline changes, output format improvements |
| commands/architect.md | Tech lead | Architect identity refinements |
| commands/implement.md | Tech lead | Implementer identity refinements |
| commands/review.md | Tech lead | Review rubric changes |
| commands/verify.md | Tech lead | Checklist changes |
| commands/pipeline.md | Tech lead | Orchestration logic changes |
