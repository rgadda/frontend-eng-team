---
name: pr-prep
description: Load this when the user is preparing to open a pull request. Walks the diff hygiene + commit message + non-negotiables sweep + description-template checklist. Reminds the user to run typecheck/lint/tests/build before pushing. Triggers — "open PR", "prep PR", "ready to ship", "ready to push", "before I push", "PR description".
---

# PR Prep — playbook

Apply this before pushing a branch or opening a PR. Run in the main context. This is a checklist, not a delegated task.

## 1. Diff hygiene

- Run `git status` and `git diff --stat` first. Confirm the changeset matches what the PR claims to do.
- No stray files: `console.log`s, `.env` changes, `.DS_Store`, generated artifacts, commented-out code.
- No unrelated formatting churn. If a file was reformatted incidentally, revert the unrelated hunks.
- No lockfile changes unless a dependency was intentionally added — and if a dependency was added, that needs the team's approval first (CLAUDE.md non-negotiable).

## 2. Non-negotiables sweep

Grep the diff for these. Any hit blocks the PR.

- `\bany\b` in `.ts`/`.tsx` files — should be `unknown` and narrowed.
- `fetch(` outside `src/api/client.ts` — should go through the shared Axios instance.
- `style={{` with static values — should be a CSS Module class.
- `console\.(log|warn|error)` — should use the logger utility if one exists; otherwise remove.
- New entries in `package.json` `dependencies`/`devDependencies` that weren't pre-approved.
- New `index.ts` files that only re-export — barrels are forbidden.
- Class components (`extends React.Component`) — functional only.

## 3. Test + type + build gates (run before pushing)

```bash
npx tsc --noEmit
npx eslint . --max-warnings=0
npx jest --silent
npx vite build         # or: npm run build
npx playwright test    # only if your change touches a critical user flow
```

All must pass. Do not push red.

## 4. Commit messages

- One commit per logical change. If the work was iterative, squash before pushing.
- Subject line: imperative mood, ≤72 chars. ("Add order confirmation modal" — not "added" or "adds".)
- If the team uses Conventional Commits, follow the prefix (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).
- Body: explain *why*, not *what*. The diff already shows the what.

## 5. PR description template

```
## Summary
<1–3 sentences: what changed and why.>

## What's in the diff
- <feature/module touched> — <one line>
- <feature/module touched> — <one line>

## Why this approach
<Trade-offs considered, alternatives rejected with one-line reason each.>

## Testing
- [ ] Typecheck (`tsc --noEmit`) — clean
- [ ] Lint (`eslint .`) — clean
- [ ] Unit (`jest`) — <pass count>/<total>
- [ ] Build (`vite build`) — succeeds
- [ ] E2E (`playwright test`) — <pass count>/<total> (only if relevant)
- [ ] Manual smoke: <what you clicked through>

## Accessibility
- [ ] Keyboard-navigable
- [ ] Focus management (modals trap + restore)
- [ ] Semantic HTML (`<button>`, `<a>`, `<dialog>`, `<nav>`)
- [ ] Accessible names on form inputs and icon-only buttons

## Risk + rollback
<What could break in prod, and how to revert quickly if it does.>

## Screenshots / recordings
<For any UI change.>
```

## 6. Reviewer-friendly polish

- If the diff is over ~300 LOC or 5 files, justify the size in the description or split the PR.
- Self-review the diff in the PR UI before requesting review — you will catch half the issues yourself.
- Link the issue/ticket if there is one. Reference any preceding architect plan or `branch-plan.md`.

## 7. Before clicking "Create PR"

- Branch is rebased onto latest `main` (or your team's trunk).
- CI is green locally on this exact SHA.
- The description answers: what, why, how to test, what could go wrong.
- No `[wip]` / `[draft]` markers unless you actually want a draft PR.
