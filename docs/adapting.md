# Adapting Relay to your project

Relay ships configured for a React 18 + TypeScript 5 + Vite frontend. The role contracts themselves are stack-agnostic — only the conventions and the Verifier's checklist carry stack assumptions. Here's what to change, and in what order.

## 1. CLAUDE.md + `.agents/conventions.md`

- **`CLAUDE.md`** holds project identity, tech stack, and communication rules. Edit the stack table and project description. Keep the structure.
- **`.agents/conventions.md`** holds every coding convention — TypeScript strictness, React patterns, HTTP client, styling, file structure, naming, testing, accessibility baseline, performance baseline, security/SRE baseline. This is the single canonical source referenced by every role. Update it to match your project's actual standards.

Conventions are tagged by severity (CRITICAL / RECOMMENDED / OPTIONAL). Reviewer and Verifier both read severity levels and gate appropriately — don't downgrade a rule just to make the gates pass. Either the rule belongs or it doesn't.

## 2. `.agents/roles/*.md`

The role contracts are stack-agnostic, but the **Verifier's 10-bucket checklist** is opinionated. Adjust it if your project has specific compliance requirements — i18n coverage, extra accessibility levels (WCAG AA vs AAA), audit logging, etc.

The **Reviewer's Security + SRE basics** are inlined in `reviewer.md` so sub-agents that don't inherit `CLAUDE.md` still enforce them. If your project has additional security baselines (e.g., CSP posture, SRI), add them to the Reviewer's checklist.

## 3. `.agents/pipeline.md`

Tweak the orchestration if you want:

- Different phase boundaries (e.g., a dedicated Research phase before Architect).
- A stricter approval gate (e.g., require two approvers for `sensitive:*` plans).
- Extra outer-loop iterations when Verifier fails (default is 1 re-entry to Implementer).

Keep the human approval gate between Architect and Implementer. Removing it defeats the "humans at the right moments" value prop.

## 4. Tool entry points

- `.claude/commands/*.md` — Claude Code slash-command wrappers. Edit only if your Claude Code integration changes shape.
- `.github/copilot-instructions.md` — Copilot paste workflow. Edit only if the role files change shape.
- Root `AGENTS.md` — the multi-tool entry point. Edit only when adding a new role.

These are thin wrappers that delegate to `.agents/`. Don't duplicate role content here — the point is single-source-of-truth.

## 5. Plugin manifest

- `.claude-plugin/marketplace.json` — update the owner / repo URL to point at your fork if you want to publish your own marketplace.
- `plugins/frontend-team/.claude-plugin/plugin.json` — bump `version` on any plugin change (subagent or skill). Cache invalidation depends on it.

## 6. Non-frontend stacks

The pipeline structure (PM → Architect → Implementer → Reviewer → Prod-Readiness → Verifier, with RCC loops and lite mode) transfers cleanly to backend and mobile work. To port:

- Rewrite `.agents/conventions.md` for your stack (e.g., Go + Chi + sqlc, Kotlin + Jetpack Compose).
- Rewrite the Reviewer's baked-in Security/SRE basics for your runtime (e.g., SQL injection, channel leaks, retry/backoff) instead of frontend-specific ones (XSS, CSP, useEffect cleanup).
- Rewrite the Verifier's 10-bucket checklist for your tooling (e.g., `go vet`, `staticcheck`, `go test -race` instead of `tsc`, `eslint`, `vite build`).
- The orchestrators (`pipeline.md`, `pipeline-lite.md`) and the RCC pattern need no changes.

## 7. Test the pipeline before team rollout

Run `/pipeline` (or the Copilot paste workflow) on a small, real task from your backlog. Validate that:

- The Architect plan reflects your conventions, not the template defaults.
- The Verifier runs your lint / typecheck / build commands, not the Vite defaults.
- The human approval gate behaves as expected on your team's branch-protection setup.

Only roll out to the broader team after one real task completes end-to-end successfully.
