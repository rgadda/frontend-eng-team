# Frontend Project — Claude Code Project Identity

> This file is auto-loaded by Claude Code on every session.
> It defines the project, the rules, and how to work with this codebase.
> Agents must read and respect everything here before taking any action.

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

## Styling Conventions

- Use CSS Modules (`.module.css`) for component-scoped styles
- Use CSS custom properties (variables) defined in `src/styles/variables.css` for theming (colors, spacing, typography)
- Use semantic class names that describe purpose, not appearance (e.g., `.container`, `.actionBar`, not `.blueBox`, `.mt-20`)
- Media queries go inside the component's CSS Module, not in a global stylesheet
- Shared layout primitives (grid, flex containers) live in `src/shared/styles/`
- No CSS-in-JS libraries. No Tailwind. Plain CSS Modules.

---

## HTTP Client Conventions

- All HTTP requests go through the shared Axios instance in `src/api/client.ts`
- Each API resource gets its own file: `src/api/[resource].api.ts`
- Request/response types are defined as interfaces in the API file or in `src/api/types/`
- Error handling uses Axios interceptors for global concerns (auth, retries) and try/catch for endpoint-specific errors
- Never call Axios directly from components — always go through an API module or a custom hook

---

## Code Style — Non-Negotiables

These are not ESLint rules. They are judgement calls that must be followed.

**TypeScript**
- `interface` over `type` for all object shapes
- Explicit return types on any exported function or hook
- Enums for finite state (not string literals)
- Prefer `unknown` over `any` when type is genuinely uncertain

**React**
- Functional components only
- Custom hooks for logic that touches state or effects
- No component file over 250 lines — split it
- Props interface named `[ComponentName]Props` in the same file

**File structure** — feature-based colocation:
```
src/
  features/
    [feature-name]/
      index.ts              (public API of the feature)
      [Feature].tsx         (main component)
      [Feature].test.tsx    (co-located unit test)
      [Feature].module.css  (co-located styles)
      [feature].hook.ts     (extracted logic)
      [feature].types.ts    (feature-local types)
  shared/
    components/             (reusable across features)
    hooks/                  (shared hooks)
    styles/                 (CSS variables, shared layouts)
    types/                  (global type definitions)
  api/
    client.ts               (Axios instance + interceptors)
    types/                  (shared API types)
    [resource].api.ts       (one file per API resource)
e2e/
  [feature].spec.ts         (Playwright E2E tests)
```

**Naming**
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Files: `kebab-case` except components (`PascalCase.tsx`)
- API files: `[resource].api.ts`
- Unit test files: `[ComponentOrHook].test.tsx`
- E2E test files: `[feature].spec.ts`
- CSS Modules: `[Component].module.css`

**Comments**
- Explain *why*, never *what*
- `// TODO:` with a ticket reference only
- No commented-out code in commits

---

## Testing Conventions

### Unit Tests (Jest + React Testing Library)

- Test **contracts and behavior**, not implementation details
- Do not test internal state — test what renders and what handlers fire
- Mock at the module boundary (`jest.mock('../api/resource.api')`)
- Every new hook must have a test
- Every new component with user interaction must have a test
- Do not snapshot-test entire component trees
- Co-locate test files with the module they test

### E2E Tests (Playwright)

- E2E tests live in `e2e/` at the project root
- Test critical user flows end-to-end (login, form submission, navigation)
- Use data-testid attributes for selectors, not CSS classes or DOM structure
- Each E2E test should be independent — no shared state between tests
- E2E tests run against a local dev server, not mocked backends
- Keep E2E tests focused on happy paths and critical error paths — leave edge cases to unit tests

---

## What You Must Never Do

- Never use `any` — use `unknown` and narrow it
- Never use raw `fetch` — use the shared Axios instance
- Never put inline styles unless the value is dynamic (computed at runtime)
- Never create barrel re-exports (`index.ts` that just re-exports everything)
- Never mutate props or external state directly
- Never `console.log` in committed code — use a logger utility if one exists
- Never leave a file in a broken TypeScript state — if you can't type it correctly, stop and flag it
- Never install new dependencies without flagging it — the team must agree on additions

---

## Communication Rules

These apply to every agent in every role:

- **Architecture before code.** For any change touching more than one file, state the plan first.
- **Flag assumptions explicitly.** If you're making a decision not in the task spec, say so.
- **Surface trade-offs.** Two reasonable approaches? Name both with a one-line rationale each.
- **Respect existing patterns.** Read the surrounding code before writing. Match what's there.
- **Flag new dependencies.** If a task requires a new npm package, stop and ask before installing.
- **Be direct.** No preamble. Get to the plan or the code.
