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

## GitHub PR Metrics Script

`scripts/collect-pr-metrics.ts` is a CLI that collects merged-PR data from a GitHub repo,
splits it into a baseline and comparison window, and emits a velocity / size / review
report. It feeds the measurement workflow described in `metrics-collection.md` and
`pr-tracking.md` — run it weekly during a consulting engagement to produce the
before/after numbers for the metrics report.

### Setup

1. Install dependencies (one-time): `npm install`
2. Create a GitHub personal access token with the `repo` scope:
   https://github.com/settings/tokens
3. Export it: `export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx`
   (or pass `--token` on every invocation)

### Usage

```bash
# Default: last 28 days, first 14 = baseline, last 14 = comparison, stdout report
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app

# Or via the npm script
npm run pr-metrics -- --repo acme/web-app

# Custom windows
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --days 42 --baseline-days 21

# Machine-readable JSON for dashboards
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --output json > metrics.json

# Per-PR CSV for spreadsheet analysis
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --output csv > prs.csv
```

### Flags

| Flag | Required | Default | Description |
|---|---|---|---|
| `--repo` | yes | — | GitHub repo in `owner/repo` format |
| `--days` | no | `28` | Total days to look back |
| `--baseline-days` | no | `14` | Days within `--days` treated as the baseline (must be `< --days`) |
| `--output` | no | `stdout` | One of `stdout`, `json`, `csv` |
| `--token` | no | `$GITHUB_TOKEN` | GitHub PAT with `repo` scope |

### Exit codes

`0` on success, `1` on any error. Failure modes are reported to stderr with remediation
text: invalid repo format, missing/expired token (401), repo not found (404), rate
limit hit (with reset time), or network error.

### Tests

Co-located vitest tests live alongside the modules they cover:

```bash
npx vitest run scripts/lib/
```

(Includes pure-function tests for the metrics calculator and snapshot-free assertions
for the CSV and stdout formatters. The GitHub client is exercised end-to-end via the
script; tests use fixture data and never call the live API.)

### File layout

```
scripts/
  collect-pr-metrics.ts        <- CLI entry point
  tsconfig.json                <- Node-targeted TS config (separate from the app)
  lib/
    github-client.ts           <- Octokit wrapper, paginated fetch, typed errors
    metrics-calculator.ts      <- Pure: median, percentile, period & change metrics
    metrics-calculator.test.ts
    types.ts                   <- RawPR, PeriodMetrics, ChangeMetrics, ReportData…
    __fixtures__/sample-prs.ts <- Deterministic fixture data for tests
    formatters/
      stdout-formatter.ts      <- Human-readable report
      stdout-formatter.test.ts
      json-formatter.ts        <- Machine-readable JSON
      csv-formatter.ts         <- RFC 4180-escaped per-PR rows
      csv-formatter.test.ts
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
