# GitHub PR Metrics Script

A self-contained Node CLI that collects merged-PR data from a GitHub repository
and emits a velocity / size / review report comparing a baseline window to a
comparison window. Designed to be dropped into any Node project — no app code
required.

---

## Use this script in your own repo

You only need to copy this **`scripts/` folder** into the root of your repo.
You do not need anything else from the parent project.

### 1. Copy the folder

From the source repo (this template) to your repo:

```bash
# Run from the root of your target repo
cp -R /path/to/frontend-eng-team/scripts ./scripts
```

The folder is self-contained:

```
scripts/
  collect-pr-metrics.ts        # CLI entry point
  tsconfig.json                # Node-targeted TS config (does not affect your app)
  README.md                    # this file
  lib/
    github-client.ts
    metrics-calculator.ts
    metrics-calculator.test.ts
    types.ts
    __fixtures__/sample-prs.ts
    formatters/
      stdout-formatter.ts
      stdout-formatter.test.ts
      json-formatter.ts
      csv-formatter.ts
      csv-formatter.test.ts
```

If you do not plan to run the tests, you can delete `**/*.test.ts` and
`lib/__fixtures__/` — the script itself does not depend on them.

### 2. Install dependencies

The script needs four dev-only packages:

```bash
npm install --save-dev @octokit/rest commander tsx @types/node
```

Optional, only if you also want to run the bundled tests:

```bash
npm install --save-dev vitest
```

None of these end up in your application bundle — they are dev-only and only
loaded by `tsx` when the script runs.

### 3. (Optional) Add an npm script

Add this line to the `scripts` block of your `package.json` so the command is
shorter:

```json
{
  "scripts": {
    "pr-metrics": "tsx scripts/collect-pr-metrics.ts"
  }
}
```

### 4. Set up a GitHub token

Create a personal access token with the `repo` scope at
<https://github.com/settings/tokens>, then export it:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

(You can also pass it per-invocation with `--token`.)

### 5. Run it

```bash
# Default: last 28 days, first 14 = baseline, last 14 = comparison, stdout report
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo

# Or, if you added the npm script
npm run pr-metrics -- --repo your-org/your-repo
```

That's it. The script is now ready to use against any repo your token has read
access to.

---

## Usage examples

```bash
# Default human-readable report
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo

# Custom windows: 6 weeks total, first 3 weeks = baseline
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo --days 42 --baseline-days 21

# JSON for dashboards
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo --output json > metrics.json

# Per-PR CSV for spreadsheet analysis
npx tsx scripts/collect-pr-metrics.ts --repo your-org/your-repo --output csv > prs.csv

# Compare multiple repos
npx tsx scripts/collect-pr-metrics.ts --repo your-org/web-app    --output json > web-app.json
npx tsx scripts/collect-pr-metrics.ts --repo your-org/api-server --output json > api-server.json
```

---

## CLI flags

| Flag | Required | Default | Description |
|---|---|---|---|
| `--repo` | yes | — | GitHub repo in `owner/repo` format |
| `--days` | no | `28` | Total days to look back |
| `--baseline-days` | no | `14` | Days within `--days` treated as the baseline (must be `< --days`) |
| `--output` | no | `stdout` | One of `stdout`, `json`, `csv` |
| `--token` | no | `$GITHUB_TOKEN` | GitHub PAT with `repo` scope |

---

## Sample stdout output

```
PR Metrics Report: your-org/your-repo
Period: 2026-03-28 to 2026-04-25 (28 days)
Baseline: 2026-03-28 to 2026-04-11 (14 days)
Comparison: 2026-04-11 to 2026-04-25 (14 days)

--- VELOCITY ---
                        Baseline    Comparison    Change
PRs merged              12          27            +125%
PRs/engineer/week       1.5         3.4           2.3x
Median time to merge    26.3 hrs    8.1 hrs       -69%
P90 time to merge       48.2 hrs    18.5 hrs      -62%

--- PR SIZE ---
                        Baseline    Comparison    Change
Avg lines changed       342         187           -45%
Median lines changed    215         124           -42%
Avg files changed       8.2         4.1           -50%

--- REVIEW ---
                        Baseline    Comparison    Change
Avg review comments     3.2         5.1           +59%
Unique contributors     4           4             --
```

---

## Exit codes & error handling

The script exits `0` on success and `1` on any error. Failure modes are
reported to stderr with remediation text:

| Failure | Message |
|---|---|
| Invalid `--repo` format | `Invalid repo format: "..."` (must be `owner/repo`) |
| Missing token | `No GitHub token provided.` + setup instructions |
| 401 (auth failed) | `GitHub authentication failed (401)` + token-regen instructions |
| 404 (repo not found) | `Repository "..." not found (404).` |
| Rate limited | `GitHub rate limit exceeded. Resets at <ISO timestamp>.` |
| Network error | `Network error contacting GitHub API: <details>` |
| No PRs in range | (Not an error.) Stderr message + zeroed metrics on stdout. |

---

## Running the tests

If you copied the test files and installed `vitest`:

```bash
npx vitest run scripts/lib/
```

Tests use deterministic fixture data in `lib/__fixtures__/sample-prs.ts` and
**never call the live GitHub API**, so they are safe to run in CI.

---

## Notes

- This script is read-only — it never writes to the GitHub API.
- Your token is never logged or written to disk by the script.
- Pagination is handled automatically; the script will fetch all merged PRs in
  the requested window even for high-volume repos.
- Dates are in UTC; `--days` counts calendar days back from "now" in UTC.
