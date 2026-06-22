---
name: component-conventions
description: Load this when creating or modifying a React component, hook, or feature module. Covers functional-only React 18, TS strict (no any, interfaces over types, explicit return types), CSS Modules with variables from src/styles/variables.css, Axios via src/api/client.ts, feature-colocated file layout, and co-located Jest+RTL tests. Triggers — "new component", "add component", "create hook", "refactor component", "modify feature", "build a form".
---

# Component Conventions — playbook

Apply these rules to any component or hook you write or modify in this repo. Run in the main context — these are convention reminders, not a delegated task.

## TypeScript

- **No `any`.** Use `unknown` and narrow it. If a type is genuinely uncertain at a boundary, type the boundary, not the consumer.
- **`interface` over `type`** for object shapes (props, API payloads, domain entities).
- **Explicit return types** on every exported function and hook. Internal helpers can infer.
- **Enums for finite state**, not string literal unions. `enum OrderStatus { Pending = 'pending', ... }`.
- Props interface named `[ComponentName]Props`, colocated in the same file as the component.

## React

- **Functional components only.** No class components.
- **Custom hooks** for any logic that touches state or effects. Hook file: `[feature].hook.ts`.
- **No component file over 250 lines.** Split into subcomponents or extract a hook.
- **No prop mutation.** Treat props as readonly. Same for external state.
- **No inline anonymous components** inside render — define them at module scope.

## File layout (feature-colocated)

```
src/features/[feature-name]/
  index.ts              # public API of the feature (named exports only, NOT a barrel)
  [Feature].tsx         # main component
  [Feature].test.tsx    # co-located unit test
  [Feature].module.css  # co-located styles
  [feature].hook.ts     # extracted stateful logic
  [feature].types.ts    # feature-local types
```

- Shared building blocks go in `src/shared/components/`, `src/shared/hooks/`, `src/shared/styles/`, `src/shared/types/`.
- API resources live in `src/api/[resource].api.ts`.
- E2E tests live in `e2e/[feature].spec.ts`.

## Naming

- Components: `PascalCase.tsx`.
- Hooks: `useCamelCase` inside `[feature].hook.ts`.
- Files: `kebab-case` except components (`PascalCase.tsx`).
- CSS Modules: `[Component].module.css`.

## Styling — CSS Modules only

- Co-locate `[Component].module.css` next to the component.
- Pull colors, spacing, typography from CSS custom properties defined in `src/styles/variables.css`. Do not hardcode hex values or px spacing for theme tokens.
- Semantic class names: `.container`, `.actionBar`, `.errorMessage` — never `.blueBox`, `.mt-20`.
- **No inline `style={{ ... }}`** unless the value is computed at runtime (e.g., a transform driven by drag position). Static styling goes in the CSS Module.
- Media queries live inside the component's CSS Module.
- No CSS-in-JS, no Tailwind.

## HTTP

- **Never** call `fetch` directly. Never `import axios` directly.
- Use the shared Axios instance: `import { client } from 'src/api/client'`.
- Wrap each resource in `src/api/[resource].api.ts` and export typed functions. Interfaces for request and response — never `any`.
- Components never call Axios directly. Go through an API module or a custom hook that wraps it.
- Endpoint-specific error handling lives in try/catch at the call site; cross-cutting concerns (auth, retries) live in Axios interceptors.

## Testing (Jest + React Testing Library)

- Every new hook: a co-located `.test.tsx` is required.
- Every new interactive component: a co-located `.test.tsx` is required.
- Test contracts and behavior: what renders, what handlers fire, what API call is made.
- **Do not** test internal state. **Do not** snapshot whole component trees.
- Mock at the module boundary: `jest.mock('../api/orders.api')`.

## E2E (Playwright)

- Add an `e2e/[feature].spec.ts` only for new critical user flows.
- Selectors: `data-testid="..."` — never CSS classes or DOM structure.
- Each test is independent. No shared state.

## What to refuse / flag (hard non-negotiables)

If the requested change requires any of these, STOP and flag it to the user before writing:

- `any` type anywhere.
- Raw `fetch(...)` in feature code.
- Inline static styles.
- New barrel re-exports.
- A new npm dependency.
- Mutating props or external state.
- `console.log` in code intended for commit.
- Leaving the file in a state that does not type-check.

## Before you finish

- Ran the typecheck mentally — every exported function has an explicit return type.
- Co-located test is in place for any new hook or interactive component.
- CSS Module exists; no inline static styles; variables from `src/styles/variables.css`.
- HTTP goes through `src/api/client.ts` via an `[resource].api.ts` module.
- File is under 250 lines.
