# sample-app

Minimal React 18 + TypeScript + Vite app used as the **fixture** that the Relay pipeline is tuned against. The role contracts in `.agents/roles/` and the skills in `skills/` reference this app's conventions (Axios client, feature-colocated modules, CSS Modules, Jest + RTL, etc.).

You don't need this app to use Relay in your own project — `ft-bootstrap` only copies `.agents/` and `.claude/commands/`. This folder exists so contributors to Relay itself have something concrete to exercise the pipeline against.

## Run

```bash
cd examples/sample-app
npm install
npm run dev     # vite dev server
npm run build   # tsc + vite production build
npm run lint    # eslint
npm test        # vitest
```

## Stack

React 18 · TypeScript 5 (strict) · Vite · CSS Modules · ESLint · Vitest · React Testing Library.
Conventions for all of the above live in [`.agents/conventions.md`](../../.agents/conventions.md).
