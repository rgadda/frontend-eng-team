# Frontend Project — Claude Code Project Identity

> This file is auto-loaded by Claude Code on every session.
> Compact by design — it seeds project identity and points at canonical rules.
> Agents must read and respect everything referenced here before taking any action.

---

## Project

**Type:** React SPA with Node.js/REST backend
**Your role in this session:** Read AGENTS.md to determine your current role. Obey its contract exactly.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| UI Framework | React 18 (functional only) | No class components. Ever. |
| Language | TypeScript 5 (strict mode) | No `any`. Explicit return types on public functions. |
| Build | Vite | No webpack config, no CJS imports |
| Styling | CSS3 + CSS Modules | Co-located `.module.css` files. No inline styles except dynamic values. |
| HTTP Client | Axios | Centralized instance with interceptors. No raw `fetch` in feature code. |
| State | Context + hooks | No Redux unless it already exists in a file |
| API | REST | Typed with interfaces, never `any` response shapes |
| Unit Testing | Jest + React Testing Library | Co-located `.test.tsx` files |
| E2E Testing | Playwright | Tests in `e2e/` directory at project root |
| Linting | ESLint + Prettier | Match existing file style before writing |
| Package Manager | npm | Lockfile must be committed |

---

## Conventions

All coding conventions — TypeScript, React, HTTP client, styling, file structure, naming, testing (unit + E2E), hard never-dos, accessibility baseline, performance baseline, security/SRE baseline — live in **[`.agents/conventions.md`](./.agents/conventions.md)**. Read that file once and enforce every rule at the severity it specifies (CRITICAL / RECOMMENDED / OPTIONAL). This CLAUDE.md file intentionally does not restate them; `.agents/conventions.md` is the single canonical source. Subagents that do not inherit CLAUDE.md must load `.agents/conventions.md` explicitly.

---

## Communication Rules

These apply to every agent in every role:

- **Architecture before code.** For any change touching more than one file, state the plan first.
- **Flag assumptions explicitly.** If you're making a decision not in the task spec, say so.
- **Surface trade-offs.** Two reasonable approaches? Name both with a one-line rationale each.
- **Respect existing patterns.** Read the surrounding code before writing. Match what's there.
- **Flag new dependencies.** If a task requires a new npm package, stop and ask before installing.
- **Be direct.** No preamble. Get to the plan or the code.
