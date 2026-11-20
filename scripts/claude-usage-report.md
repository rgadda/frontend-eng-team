# Claude Code Usage Report

A zero-dependency Python script that reads your local Claude Code session
transcripts and produces a workflow-optimization report: token spend by project,
cache-hit ratio, tool-call mix, rework loops, and file re-read offenders.

Runs entirely on your machine. Nothing is uploaded anywhere.

---

## Why

The Anthropic console shows you **cost** per day. It does not tell you *why* a
session was expensive — whether context was churning, whether a subagent would
have helped, or whether the same file got re-read twenty times after a
compaction. This script pulls those signals out of the JSONL transcripts
Claude Code already writes to `~/.claude/projects/`.

## What it reads

```
~/.claude/projects/<escaped-project-path>/<session-id>.jsonl
```

Each `assistant` record carries a `usage` block with `input_tokens`,
`output_tokens`, `cache_read_input_tokens`, and `cache_creation_input_tokens`.
Tool calls appear inline on assistant turns; tool results (and their error
flags) appear on the next user turn. The script aggregates these per session.

## Install

Nothing to install — Python 3.9+ standard library only.

```bash
chmod +x scripts/claude-usage-report.py
```

## Usage

```bash
# Default: last 7 days, human-readable report
python3 scripts/claude-usage-report.py

# Wider window
python3 scripts/claude-usage-report.py --days 30

# Absolute cutoff
python3 scripts/claude-usage-report.py --since 2026-11-01
python3 scripts/claude-usage-report.py --since 2026-11-01T09:00

# Filter to one project (substring match on label or path)
python3 scripts/claude-usage-report.py --days 30 --project frontend-eng-team

# Machine-readable for dashboards / piping into jq
python3 scripts/claude-usage-report.py --days 30 --json > usage.json
```

### Flags

| Flag | Default | Description |
|---|---|---|
| `--days N` | `7` | Look-back window in days. Mutually exclusive with `--since`. |
| `--since YYYY-MM-DD` | — | Absolute cutoff. Accepts `YYYY-MM-DD` (local midnight) or full ISO 8601. |
| `--project <substr>` | — | Substring filter on project label or full path. |
| `--json` | off | Emit machine-readable JSON instead of the stdout report. |

## What the report shows

- **Headline**: sessions, projects, total tokens broken into input / output /
  cache-read / cache-create, overall cache-hit ratio.
- **By project**: token spend, cache-hit ratio, and total wall-clock duration
  per project.
- **Top 10 sessions by token spend**: date, project, tokens, cache %, turns,
  tool-call count. Fast way to spot the outlier session dominating your bill.
- **Tool-call mix**: histogram across all sessions (Read / Edit / Bash / Agent /
  WebFetch / MCP tools / etc.), plus total tool errors and subagent spawns.
- **Leak signal — files Read >3× in a single session**: a high count usually
  means context was lost (compaction, or the agent forgetting it already had
  the file).
- **Rework signal — files Edited >5× in a single session**: a high count means
  the implementation did not land cleanly and had to be iterated.
- **Interpretation hints**: a few rules-of-thumb flagged automatically (e.g.
  cache hit <50%, tool error rate >5%, Read ≫ Edit ratio).

### Sample output (trimmed)

```
Claude Code usage — last 30 days
================================
Sessions:        9
Projects:        7
Total tokens:    367.71M
  input (fresh): 4.0k
  output:        9.23M
  cache read:    340.36M
  cache create:  18.11M
Cache hit ratio: 94.9%   (>80% is healthy; <50% means prompts/context churn)

By project
----------
project                                        sessions  tokens  cache%  dur(min)
experimentIdeas                                       1  278.4M   95.3%     175.0
ai-dev-workflow-consulting-frontend-eng-team          3   83.6M   94.5%  39632.4
ai-radar                                              1    2.0M   81.1%  62735.1
…

Tool-call mix (all sessions)
----------------------------
  Bash                   99    6.4%  ##
  Edit                   40    2.6%  #
  Read                   29    1.9%
  Agent                  15    1.0%
  …
  Tool errors:      9  (0.6% of all tool calls)
  Subagent spawns:  15

Leak signal — files Read >3x in a single session
------------------------------------------------
  (none — good)

Rework signal — files Edited >5x in a single session
----------------------------------------------------
    8x  .../ganbare-kids/content/pinned-posts-01-03.md   [2026-10-22]
    6x  .../frontend-eng-team/package.json               [2026-11-06]
```

## How to read the output

- **Cache-hit ratio under 50%** → you're paying full freight on input tokens.
  Usual causes: too many short sessions, editing `CLAUDE.md` mid-session,
  quitting instead of `/clear`.
- **One session dominates total spend** → check whether it's a bulk tool loop
  (e.g. hundreds of MCP calls). If yes, convert it to a standalone script and
  don't pay model tokens to iterate.
- **High Read count with no Edits** → you're doing exploration in main
  context. Delegate to the Explore subagent so it doesn't eat your context
  window.
- **Same file Read many times in one session** → context loss. Start a fresh
  session when a feature finishes rather than resuming for weeks.
- **Same file Edited many times in one session** → implementation didn't land
  on the first pass. Look at the plan quality or the test loop.

## Caveats

- **Local only.** Covers sessions on this machine. For $ cost and cross-device
  totals, check [console.anthropic.com → Usage](https://console.anthropic.com/).
- **Mtime-based filtering.** A session whose last activity is after the cutoff
  is pulled in *in full*, including turns from before the cutoff. This matches
  how you'd naturally read it ("that session cost me X total") but means
  `--since yesterday` on a long-lived session shows the whole session.
- **Rotated sessions are gone.** Claude Code periodically cleans up old session
  files (see `~/.claude/.last-cleanup`). Anything rotated out is unrecoverable.
- **Duration ≠ working time.** Session duration is wall-clock between first
  and last record. A session you resumed over three weeks will show thousands
  of minutes of "duration" that was mostly idle.

## Privacy

The script reads only your local `~/.claude/projects/` tree and prints to
stdout. It makes no network calls, writes no files, and never transmits any
transcript content.
