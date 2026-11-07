# Contributing to Relay

Thanks for your interest in contributing. Relay is a thin, opinionated framework — the goal is to keep it sharp, not to grow it endlessly. Contributions that make the existing pipeline cleaner, cheaper, or more adaptable are welcome. Contributions that add roles, phases, or ceremony need strong motivation.

## Ways to contribute

- **Bug reports** — open an [issue](https://github.com/rgadda/relay/issues/new/choose) with a repro.
- **Convention refinements** — propose edits to `.agents/conventions.md` with a short rationale (why the current rule is wrong or incomplete).
- **Role / subagent / skill improvements** — PRs that sharpen an existing prompt, tighten an output format, or close a failure mode.
- **New stack adapters** — port the pipeline to a non-React stack (backend, mobile) in a fork and submit a `docs/adapting.md` case study.
- **Documentation** — clarifications, typos, better examples.

## Before you open a PR

1. **Run the pipeline on a real task** using your changes. If the Architect / Implementer / Reviewer / Verifier output degrades, so does the PR.
2. **Lint and build must pass locally.**
   ```bash
   npm ci
   npm run lint
   npm run build
   ```
3. **Keep PRs focused.** One role change, one convention edit, or one doc update per PR. Bundled refactors get rejected.
4. **Follow the PR template** — the checklist exists because every item has caught a real regression.

## Local development

```bash
git clone https://github.com/rgadda/relay.git
cd relay
npm ci
```

To test role changes end-to-end, bootstrap a throwaway target repo:

```bash
mkdir /tmp/relay-test && cd /tmp/relay-test
npm init -y && git init
/path/to/relay/scripts/ft-bootstrap.sh
# then run /pipeline <task> inside Claude Code
```

## Plugin version bumps

Any change inside `plugins/frontend-team/` **must** bump `plugins/frontend-team/.claude-plugin/plugin.json#version` and the matching entry in `.claude-plugin/marketplace.json`. The subagent and skill prompts form part of the cached prefix in every installed session; stale caches silently break behavior. Bump the version so teams re-pull.

Semver guidance:

- **Patch** — prompt wording tweaks, typo fixes, no output-shape change.
- **Minor** — new subagent, new skill, additional checklist item.
- **Major** — breaking change to a subagent's output format, removal of a subagent or skill, renamed trigger keywords.

## Role / subagent / skill ownership

| File | When to update |
|---|---|
| `CLAUDE.md` | Stack changes, new conventions, new dependencies |
| `AGENTS.md` | Multi-tool entry-point updates (rare) |
| `.agents/conventions.md` | Any coding convention change — the single canonical source |
| `.agents/pipeline.md` | Phase, approval-gate, RCC, or outer-loop logic changes |
| `.agents/pipeline-lite.md` | Lite-orchestrator changes: sensitivity keywords, verdict menu, cost thresholds, entry gate |
| `.agents/roles/pm.md` | PM identity, PRD format, skip-rule refinements |
| `.agents/roles/architect.md` | Architect identity, output format, sensitive-tag list, RCC checklist refinements |
| `.agents/roles/implementer.md` | Implementer identity, output format, RCC checklist refinements |
| `.agents/roles/implementer-lite.md` | Lite-mode Implementer overrides — keep aligned with `implementer.md` |
| `.agents/roles/reviewer.md` | Review rubric, Security/SRE basics, severity-level changes |
| `.agents/roles/reviewer-lite.md` | Lite-mode Reviewer overrides — keep aligned with `reviewer.md` |
| `.agents/roles/prod-readiness.md` | Security + SRE deep-pass checklist, sensitive-tag triggers |
| `.agents/roles/verifier.md` | 10-bucket checklist or quality-gate changes |
| `.agents/memory/schema.md` | JSONL record shape or read/write pattern changes |
| `.agents/memory/append.sh` | Append helper — treat as versioned, bump plugin/repo when changed |
| `.claude/commands/*.md` | Claude Code slash-command wiring (only when delegation pattern changes) |
| `.claude-plugin/marketplace.json` | Bump plugin version entry whenever the plugin is updated |
| `plugins/frontend-team/agents/*.md` | Subagent contracts — bump plugin version on any change |
| `plugins/frontend-team/skills/**` | Skill bodies and triggers — bump plugin version on any change |
| `.github/copilot-instructions.md` | Copilot paste-workflow updates (only when role files change shape) |
| `scripts/ft-bootstrap.sh` | Bootstrap logic — update when the file map changes |
| `scripts/setup-global.md` | Global setup instructions — update when install commands change |

## Code of conduct

Be kind. Be direct. Review the code, not the person. No preamble, no sycophancy — the same rules we ask of the agents apply to us.

## Questions

Open a [Discussion](https://github.com/rgadda/relay/discussions) for design questions, or an [Issue](https://github.com/rgadda/relay/issues) for bugs.
