# Frontend Non-Negotiables

> Canonical convention source. Loaded by CLAUDE.md, role files, and subagents.
> Update this file first; downstream references follow. Any rule marked
> CRITICAL is a blocking finding at review time.

---

## TypeScript

- No `any`. Use `unknown` and narrow it. Any occurrence is CRITICAL.
- `interface` over `type` for object shapes.
- Explicit return types on every exported function and hook.
- Enums for finite state, not string literal unions.

## React

- Functional components only. Class components are CRITICAL.
- Props interface named `[ComponentName]Props` colocated in the same file.
- No component file over 250 lines — split it.
- Custom hooks for logic that touches state or effects.
- No mutation of props or external state.

## HTTP client

- All HTTP requests go through the shared Axios instance in `src/api/client.ts`.
- Raw `fetch(` in feature code is CRITICAL.
- Each API resource gets its own `src/api/[resource].api.ts`.
- Components never call Axios directly — always via an API module or custom hook.
- Request/response types as `interface`, never `any`.
- Global concerns (auth, retries) via Axios interceptors; endpoint-specific errors via try/catch.

## Styling

- CSS Modules (`.module.css`) co-located with the component.
- CSS custom properties from `src/styles/variables.css` for theming.
- No inline `style={{ ... }}` except for genuinely dynamic runtime values. Static inline styles are CRITICAL.
- No CSS-in-JS libraries. No Tailwind. Plain CSS Modules only.
- Semantic class names (`.actionBar`, not `.blueBox`).
- Media queries inside the component's CSS Module, not global stylesheets.
- Shared layout primitives in `src/shared/styles/`.

## File structure — feature-colocated

```
src/features/[feature]/
  index.ts                      (public API)
  [Feature].tsx                 (component)
  [Feature].test.tsx            (co-located unit test)
  [Feature].module.css          (styles)
  [feature].hook.ts             (extracted logic)
  [feature].types.ts            (feature-local types)
src/shared/{components,hooks,styles,types}
src/api/client.ts + [resource].api.ts
e2e/[feature].spec.ts
```

New files outside this layout are RECOMMENDED to relocate (CRITICAL if the file bypasses `src/api/client.ts`).

## Naming

- Components: `PascalCase`
- Hooks: `useCamelCase`
- Files: `kebab-case` except components (`PascalCase.tsx`)
- API files: `[resource].api.ts`
- Unit tests: `[ComponentOrHook].test.tsx`
- E2E tests: `[feature].spec.ts`
- CSS Modules: `[Component].module.css`

## Testing

### Unit (Jest + React Testing Library)

- Test contracts and behavior, not implementation details.
- Do not test internal state — test what renders and what handlers fire.
- Mock at module boundaries (`jest.mock('../api/resource.api')`), not deep internals.
- Every new hook MUST have a co-located `.test.tsx` — missing is CRITICAL.
- Every new component with user interaction MUST have a test — missing is CRITICAL.
- No full-tree snapshot tests.
- Prefer `userEvent` over `fireEvent`.

### E2E (Playwright)

- Live in `e2e/` at project root.
- Test critical flows end-to-end (login, form submission, navigation).
- `data-testid` selectors, not CSS classes or DOM structure.
- Each test independent — no shared state.
- Run against local dev server, not mocked backend.
- Happy paths + critical error paths only. Edge cases go to unit tests.

## Hard "never do"s — all CRITICAL if present

- `any` type
- Raw `fetch(`
- Inline static styles
- New barrel re-exports (`index.ts` that just re-exports)
- Mutating props or external state
- `console.log` in committed code
- Broken TypeScript state (file does not type-check)
- New npm dependencies without explicit approval

## Comments

- Explain *why*, never *what*.
- `// TODO:` with a ticket reference only.
- No commented-out code in commits.

## Accessibility baseline

- Interactive elements use `<button>` / `<a>` / `<dialog>` — not `<div onClick>`.
- Form inputs have `<label htmlFor>` or `aria-label`.
- Focus management on modal open/close (trap, restore on close, handle Escape).
- `aria-live` for dynamic status changes.

## Performance baseline

- New dependencies must be justified (CRITICAL if unjustified).
- Memoization only on proven hot paths — no blanket `useMemo` / `useCallback`.
- Dynamic imports for large route-level chunks.
- Images with explicit dimensions, lazy loading applied.
- Animations target `transform` / `opacity` (compositor properties).
- Respect `prefers-reduced-motion`.

## Security + SRE baseline

- Tokens or secrets in `localStorage` or client bundle → CRITICAL.
- `dangerouslySetInnerHTML` without a sanitizer (DOMPurify or equivalent) → CRITICAL.
- User input into URL / `href` / `src` / query string without encoding → CRITICAL.
- Silent `catch { }` blocks (no re-throw, no log, no user-visible handling) → CRITICAL.
- Outbound network call with no timeout → RECOMMENDED (CRITICAL if user-blocking).
- `useEffect` without cleanup for listeners / timers / subscriptions / in-flight requests → CRITICAL for frequently-mounted components, RECOMMENDED otherwise.
- 4xx / 5xx / offline / timeout without user-visible failure path → CRITICAL for user-initiated actions.
- Errors observable in production (logged with endpoint/status/correlation id at point of failure).

---

## Token estimate tuning (agent telemetry, not app code)

Roles and JSONL-appending subagents print an end-of-turn token estimate using a
standardized formula:

- Input ≈ `BASE_OVERHEAD + sum(Read/Grep result bytes this turn) / 4 + user_message_chars / 4`
- Output ≈ `chars_emitted_by_role / 4`

`BASE_OVERHEAD` is a fixed constant covering Claude Code system prompt, tool
schemas, and auto-loaded CLAUDE.md. Current value: **8000**. This is a rough
guess; real overhead varies by Claude Code version, plugin count, and MCP
server load. If observed UI figures consistently drift from the estimate,
adjust the constant here first, then propagate the same number into the 8
role/subagent files that contain the formula:

- `.agents/roles/pm.md`
- `.agents/roles/architect.md`
- `.agents/roles/implementer.md`
- `.agents/roles/reviewer.md`
- `.agents/roles/verifier.md`
- `.agents/roles/prod-readiness.md`
- `plugins/frontend-team/agents/verifier.md`
- `plugins/frontend-team/agents/prod-readiness.md`

The pipeline orchestrator sums `tokens_in` and `tokens_out` across all JSONL
records for the current branch in the PIPELINE COMPLETE / STALLED messages
(see `.agents/pipeline.md`).
