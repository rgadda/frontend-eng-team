# Spec Review — GitHub Actions automation

How to run Relay's `spec-reviewer` subagent automatically on every PR, as a shadow review alongside your human reviewers.

> **Running it locally first?** Use the `/spec-review` slash command. This doc is for the CI/automation layer. The subagent prompt and output format are identical either way.

## What you get

For every opted-in PR, a sticky comment with a per-acceptance-criterion matrix:

```
AC1: User can log in with email → PASS
  Evidence: src/features/auth/LoginForm.tsx:42 implements submit handler;
  test "logs in with valid credentials" passes

AC2: Invalid password shows error inline → FAIL
  Evidence: no change found that renders a validation error in LoginForm

AC3: Login redirects to /dashboard → PARTIAL
  Evidence: redirect implemented at LoginForm.tsx:67, no test covers it

Overall verdict: FAIL (1/3 pass, 1 partial, 1 fail)
AC2 has no implementation.
```

The bot does not block merge. It does not enforce conventions, security, or build (your `frontend-reviewer`, `prod-readiness`, and `verifier` subagents cover those, and your human reviewer does the final call). It only answers: *did the code do what the spec said it would do, and do the tests prove it?*

## Prerequisites

1. **Anthropic API key** → repo secret `ANTHROPIC_API_KEY`.
2. **Node.js + `npm test` script** → the workflow runs tests to capture output. If your test command is different (`pnpm test`, `yarn test:ci`, a pytest suite, etc.), edit the "Run tests" step.
3. **A spec source** → decide below.

## Three decisions before you copy the template

### 1. Where does the spec come from?

| Option | Setup cost | Fit |
|---|---|---|
| **PR body `## Acceptance Criteria` section** (default) | Zero — the template extracts it with `awk`. | Fast prototype. Requires team discipline to write ACs in every PR. |
| **Jira ticket, fetched by ID parsed from branch name** | Add `JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN` as repo secrets. Uncomment the alternate step in the template and delete the default one. | Teams who already write specs in Jira and name branches `feature/FE-1234-*`. |
| **`specs/<slug>.md` file in the repo** | Add a step that reads `specs/$BRANCH_SLUG.md` into `branch-plan.md`. | Teams who commit specs to the repo. |

### 2. Which PRs does it run on?

The template gates on a `spec-review-please` label — the workflow runs only when that label is applied. Why opt-in during the experiment:

- You pick exactly which PRs you're measuring.
- You can turn it off instantly by removing the label.
- No surprise bills while the subagent prompt is still being tuned.

**After 2+ weeks of good signal**, remove the `if:` guard and the trigger-type filter so it runs on every PR open/update automatically.

### 3. Cost ceiling

A rough budget planning note — the subagent uses opus for its judgment pass. Per PR, expect:
- ~2-5K input tokens (spec + diff + test log fragments cited)
- ~400-600 output tokens (the matrix)
- One or two tool-call round trips for the subagent to Read/Grep the diff file

That's ~$0.05-0.15 per PR at current opus pricing. Scale: 100 PRs/week ≈ $5-15/week. Guardrails if that's too high:

- **Keep the label gate on permanently.** Review only ships that need shadow review.
- **Switch the subagent to sonnet.** Edit `agents/spec-reviewer.md` frontmatter `model: opus` → `model: sonnet`. You lose ~15-20% judgment quality for ~5× cost savings. For many teams that's the right trade.
- **Add a path filter** to the workflow (`paths: ['src/**']`) to skip docs-only / config-only PRs.
- **Rate limit** by using a third-party action like `styfle/cancel-workflow-action` or a daily counter. Beyond the scope of this template.

## Install

1. In your target repo: register the Relay marketplace and install the plugin (one-time, if you haven't already):
   ```
   /plugin marketplace add rgadda/frontend-eng-team
   /plugin install frontend-team@frontend-team-marketplace
   ```
2. Copy [`examples/github-actions/spec-review.yml`](../examples/github-actions/spec-review.yml) to `.github/workflows/spec-review.yml` in your target repo.
3. Set `ANTHROPIC_API_KEY` in repo secrets.
4. If using the Jira spec path: uncomment that step, delete the PR-body step, add the three Jira secrets.
5. Commit, push, open a PR with a `## Acceptance Criteria` section in the description, apply the `spec-review-please` label.

## How to read the output in the first 2 weeks

For every PR the bot comments on:

1. Note which ACs the bot flagged as **FAIL** or **PARTIAL**.
2. Independently, note what the human reviewer flagged.
3. Classify each bot finding:
   - **Agreed** — bot and human both flagged it.
   - **Caught early** — bot flagged something the human later also flagged. (Signal: the bot is useful.)
   - **False positive** — bot flagged something that wasn't actually missing. (Signal: tune the prompt.)
   - **Missed** — human flagged something the bot didn't. (Signal: this AC was outside the "did spec match code" axis — likely a convention or design concern, not a spec gap. Confirm this is fine.)

After 2 weeks, if "Caught early" significantly exceeds "False positive," ship it to all PRs. If "False positive" dominates, tune `agents/spec-reviewer.md` or narrow the scope.

## Not a replacement for

- **Human review.** Humans catch design, intent drift, maintainability, team knowledge transfer. The bot can't.
- **Convention checks.** Run `/review` locally or add a separate workflow for `frontend-reviewer`.
- **Security review for sensitive changes.** Run `/pipeline` with the `sensitive:*` tag, or add a separate workflow for `prod-readiness`.
- **Build / lint / typecheck.** Your existing CI covers these.

The bot has one job. Keep it that way.
