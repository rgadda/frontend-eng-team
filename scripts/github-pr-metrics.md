# GitHub PR Metrics Script — Specification

> This document is a task spec for the pipeline. Run it through `/pipeline` to generate
> the final TypeScript script that collects PR metrics from the GitHub API.

---

## Task for the Pipeline

Build a CLI script (`scripts/collect-pr-metrics.ts`) that collects PR data from GitHub
repositories and outputs a structured metrics report. The script should be runnable via
`npx tsx scripts/collect-pr-metrics.ts` with no build step required.

---

## Requirements

### Input

The script accepts the following CLI arguments:

| Argument | Required | Default | Description |
|---|---|---|---|
| `--repo` | Yes | — | GitHub repo in `owner/repo` format (e.g., `acme/web-app`) |
| `--days` | No | `28` | Number of days to look back for PR data |
| `--baseline-days` | No | `14` | Number of days within `--days` to treat as the baseline period (counted from the start) |
| `--output` | No | `stdout` | Output format: `stdout`, `json`, or `csv` |
| `--token` | No | `GITHUB_TOKEN` env var | GitHub personal access token |

**Example usage:**
```bash
# Last 28 days, first 14 are baseline, last 14 are comparison
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --days 28

# Export as JSON for dashboarding
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --days 42 --baseline-days 21 --output json

# Multiple repos (run once per repo, compare outputs)
npx tsx scripts/collect-pr-metrics.ts --repo acme/web-app --days 28 > web-app-metrics.json
npx tsx scripts/collect-pr-metrics.ts --repo acme/api-server --days 28 > api-server-metrics.json
```

### Authentication

- Use `GITHUB_TOKEN` environment variable by default
- Accept `--token` flag as override
- If neither is provided, print a clear error message with instructions for creating a token
- Token needs `repo` scope (read access to pull requests)

### Data to Collect

For each merged PR in the date range, collect:

| Field | Source | Notes |
|---|---|---|
| PR number | `number` | |
| Title | `title` | |
| Author | `user.login` | |
| Created at | `created_at` | ISO 8601 |
| Merged at | `merged_at` | ISO 8601 |
| Time to merge (hours) | Computed | `merged_at - created_at` in hours, rounded to 1 decimal |
| Lines added | `additions` | |
| Lines deleted | `deletions` | |
| Total lines changed | Computed | `additions + deletions` |
| Files changed | `changed_files` | |
| Review comments | `review_comments` | Count of review-specific comments |
| Total comments | `comments + review_comments` | All discussion on the PR |
| Reviewers | `requested_reviewers` + actual reviewers | Unique list |
| Labels | `labels[].name` | Comma-separated |

### Metrics to Compute

#### Per-Period Metrics (computed for both baseline and comparison periods)

| Metric | Computation |
|---|---|
| Total PRs merged | Count of merged PRs in period |
| PRs per engineer per week | Total PRs / unique authors / (period days / 7) |
| Median time to merge (hours) | Median of all time-to-merge values |
| P90 time to merge (hours) | 90th percentile |
| Average PR size (lines) | Mean of total lines changed |
| Median PR size (lines) | Median of total lines changed |
| Average review comments per PR | Mean of review comment counts |
| Average files changed per PR | Mean of files changed |
| Unique contributors | Count of distinct authors |

#### Comparison Metrics (baseline vs. comparison)

| Metric | Computation |
|---|---|
| Throughput change | `(comparison PRs/week) / (baseline PRs/week)` as multiplier (e.g., 2.1x) |
| Merge time change | `(comparison median) - (baseline median)` in hours, and as % change |
| PR size change | `(comparison median size) - (baseline median size)` as % change |
| Review depth change | `(comparison avg comments) - (baseline avg comments)` as % change |

### Output Formats

#### `stdout` (default) — human-readable report

```
PR Metrics Report: acme/web-app
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

--- TOP CONTRIBUTORS ---
Author          PRs     Avg Merge Time    Avg Size
@alice          8       6.2 hrs           145 lines
@bob            7       9.8 hrs           203 lines
@carol          6       7.1 hrs           168 lines
@dave           6       11.4 hrs          221 lines
```

#### `json` — machine-readable

```json
{
  "repo": "acme/web-app",
  "generated_at": "2026-04-25T10:30:00Z",
  "period": {
    "start": "2026-03-28",
    "end": "2026-04-25",
    "total_days": 28
  },
  "baseline": {
    "start": "2026-03-28",
    "end": "2026-04-11",
    "days": 14,
    "metrics": { ... }
  },
  "comparison": {
    "start": "2026-04-11",
    "end": "2026-04-25",
    "days": 14,
    "metrics": { ... }
  },
  "change": {
    "throughput_multiplier": 2.3,
    "merge_time_change_pct": -69,
    "pr_size_change_pct": -42,
    "review_depth_change_pct": 59
  },
  "prs": [ ... ]
}
```

#### `csv` — spreadsheet-friendly

One row per PR with all collected fields. Include a header row.

---

## Technical Constraints

### Dependencies

- `@octokit/rest` — GitHub API client (typed, maintained, official)
- `commander` — CLI argument parsing
- `tsx` — TypeScript execution without build step (dev dependency only)
- No other dependencies. Do not add charting, formatting libraries, or anything else.

### Code Structure

```
scripts/
  collect-pr-metrics.ts      (main entry point — CLI parsing, orchestration)
  lib/
    github-client.ts          (Axios-based GitHub API calls with pagination)
    metrics-calculator.ts     (pure functions: compute all metrics from raw PR data)
    formatters/
      stdout-formatter.ts     (human-readable table output)
      json-formatter.ts       (JSON output)
      csv-formatter.ts        (CSV output)
    types.ts                  (all interfaces: RawPR, PRMetrics, PeriodMetrics, ReportData)
```

### Implementation Notes

- **Pagination**: GitHub API returns max 100 PRs per page. The script must paginate to collect all merged PRs in the date range. Use the `Link` header or Octokit's built-in pagination.
- **Rate limiting**: Respect GitHub API rate limits. If rate-limited, print a message with the reset time and exit gracefully. Do not retry in a loop.
- **Median/percentile calculation**: Implement without external libraries. Sort the array, pick the middle value (or average of two middle values for even-length arrays).
- **Time zones**: All dates should be in UTC. The `--days` flag counts calendar days back from now in UTC.
- **Error handling**:
  - Invalid repo format: print usage and exit with code 1
  - Auth failure (401): print token setup instructions and exit with code 1
  - Repo not found (404): print clear message and exit with code 1
  - Network error: print the error and exit with code 1
  - No PRs found in range: print a message (not an error), output empty metrics
- **No `any`**: All types must be explicit. Use Octokit's built-in types for API responses.

### Testing

Create co-located test files:

| File | Tests |
|---|---|
| `lib/metrics-calculator.test.ts` | Median, percentile, per-period metrics, comparison metrics with known inputs |
| `lib/formatters/stdout-formatter.test.ts` | Output structure with sample data |
| `lib/formatters/csv-formatter.test.ts` | Header row, value escaping, date formatting |

Use fixture data — do not call the GitHub API in tests. Create a `lib/__fixtures__/sample-prs.ts` file with 10-15 realistic PR objects covering edge cases (zero comments, single-file PRs, long-running PRs, same-day merges).

---

## Acceptance Criteria

- [ ] `npx tsx scripts/collect-pr-metrics.ts --repo owner/repo` produces a readable stdout report
- [ ] `--output json` produces valid JSON that matches the schema above
- [ ] `--output csv` produces valid CSV with headers
- [ ] Script handles repos with 100+ merged PRs (pagination works)
- [ ] Script exits gracefully on auth failure, 404, rate limit, and network errors
- [ ] No `any` types anywhere in the codebase
- [ ] All three test files pass with `npx jest scripts/lib/`
- [ ] Script runs without a build step via `npx tsx`

---

## What This Is For

This script collects the raw data that feeds into `pr-tracking.md` and `metrics-collection.md`.
Instead of manually counting PRs and calculating medians from the GitHub UI, engineers run this
script once a week and get a complete before/after comparison.

For consulting engagements, this script is part of the measurement framework deliverable:
1. Run it against the client's repos before the pipeline rollout (baseline)
2. Run it weekly during the engagement (comparison)
3. Include the output in the weekly metrics report
4. The JSON output can feed into dashboards if the client wants automation later
