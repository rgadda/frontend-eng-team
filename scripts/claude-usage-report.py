#!/usr/bin/env python3
"""
Claude Code usage report — reads ~/.claude/projects/**/*.jsonl and prints
workflow-optimization signals: token spend, cache efficiency, tool-call mix,
rework loops, and file re-read offenders.

Usage:
    python3 scripts/claude-usage-report.py              # last 7 days
    python3 scripts/claude-usage-report.py --days 30
    python3 scripts/claude-usage-report.py --since 2026-11-01
    python3 scripts/claude-usage-report.py --since 2026-11-01 --project frontend-eng-team
    python3 scripts/claude-usage-report.py --json       # machine-readable
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path


PROJECTS_DIR = Path.home() / ".claude" / "projects"


@dataclass
class SessionStats:
    session_id: str
    project: str
    path: Path
    first_ts: datetime | None = None
    last_ts: datetime | None = None
    user_turns: int = 0
    assistant_turns: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_creation_tokens: int = 0
    web_search_requests: int = 0
    web_fetch_requests: int = 0
    tool_calls: Counter = field(default_factory=Counter)
    tool_errors: int = 0
    file_reads: Counter = field(default_factory=Counter)   # path -> count
    file_edits: Counter = field(default_factory=Counter)   # path -> count
    bash_commands: int = 0
    bash_errors: int = 0
    subagent_spawns: int = 0

    @property
    def total_tokens(self) -> int:
        return (
            self.input_tokens
            + self.output_tokens
            + self.cache_read_tokens
            + self.cache_creation_tokens
        )

    @property
    def cache_hit_ratio(self) -> float:
        denom = self.input_tokens + self.cache_read_tokens + self.cache_creation_tokens
        return (self.cache_read_tokens / denom) if denom else 0.0

    @property
    def duration_min(self) -> float:
        if self.first_ts and self.last_ts:
            return (self.last_ts - self.first_ts).total_seconds() / 60.0
        return 0.0


def parse_ts(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def project_label(project_dir: str) -> str:
    # Directory encodes the full path with "/" replaced by "-", e.g.
    # -Users-rajivgadda-Documents-workspace-claude-code-ai-dev-workflow-consulting-frontend-eng-team
    # We can't reverse the hyphen flattening perfectly, so prefer the tail
    # after a known anchor ("workspace" or "claude-code"), else last 4 tokens.
    name = project_dir.lstrip("-")
    if not name:
        return project_dir
    parts = name.split("-")
    for anchor in ("claude-code", "workspace"):
        toks = anchor.split("-")
        for i in range(len(parts) - len(toks) + 1):
            if parts[i:i + len(toks)] == toks:
                tail = parts[i + len(toks):]
                if tail:
                    return "-".join(tail)
    return "-".join(parts[-4:]) if len(parts) > 4 else name


def extract_tool_uses(content) -> list[dict]:
    if not isinstance(content, list):
        return []
    return [b for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]


def extract_tool_results(content) -> list[dict]:
    if not isinstance(content, list):
        return []
    return [b for b in content if isinstance(b, dict) and b.get("type") == "tool_result"]


def process_session(path: Path) -> SessionStats | None:
    project = project_label(path.parent.name)
    stats = SessionStats(session_id=path.stem, project=project, path=path)

    try:
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue

                rtype = rec.get("type")
                ts = parse_ts(rec.get("timestamp"))
                if ts:
                    if stats.first_ts is None or ts < stats.first_ts:
                        stats.first_ts = ts
                    if stats.last_ts is None or ts > stats.last_ts:
                        stats.last_ts = ts

                if rtype == "user":
                    stats.user_turns += 1
                    msg = rec.get("message", {}) or {}
                    for tr in extract_tool_results(msg.get("content")):
                        if tr.get("is_error"):
                            stats.tool_errors += 1

                elif rtype == "assistant":
                    stats.assistant_turns += 1
                    msg = rec.get("message", {}) or {}
                    usage = msg.get("usage") or {}
                    stats.input_tokens += int(usage.get("input_tokens") or 0)
                    stats.output_tokens += int(usage.get("output_tokens") or 0)
                    stats.cache_read_tokens += int(usage.get("cache_read_input_tokens") or 0)
                    stats.cache_creation_tokens += int(usage.get("cache_creation_input_tokens") or 0)
                    stu = usage.get("server_tool_use") or {}
                    stats.web_search_requests += int(stu.get("web_search_requests") or 0)
                    stats.web_fetch_requests += int(stu.get("web_fetch_requests") or 0)

                    for tu in extract_tool_uses(msg.get("content")):
                        name = tu.get("name", "?")
                        stats.tool_calls[name] += 1
                        inp = tu.get("input") or {}
                        if name == "Read":
                            fp = inp.get("file_path")
                            if fp:
                                stats.file_reads[fp] += 1
                        elif name in ("Edit", "Write", "NotebookEdit"):
                            fp = inp.get("file_path") or inp.get("notebook_path")
                            if fp:
                                stats.file_edits[fp] += 1
                        elif name == "Bash":
                            stats.bash_commands += 1
                        elif name == "Agent":
                            stats.subagent_spawns += 1
    except OSError:
        return None

    return stats


def parse_since(raw: str) -> datetime:
    """Accept YYYY-MM-DD or full ISO 8601; interpret bare dates as local midnight."""
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError as e:
        raise argparse.ArgumentTypeError(
            f"--since must be YYYY-MM-DD or ISO 8601 (got {raw!r})"
        ) from e
    if dt.tzinfo is None:
        dt = dt.astimezone()  # attach local tz
    return dt.astimezone(timezone.utc)


def collect(cutoff: datetime, project_filter: str | None) -> list[SessionStats]:
    results: list[SessionStats] = []
    if not PROJECTS_DIR.exists():
        return results
    for jsonl in PROJECTS_DIR.rglob("*.jsonl"):
        try:
            mtime = datetime.fromtimestamp(jsonl.stat().st_mtime, tz=timezone.utc)
        except OSError:
            continue
        if mtime < cutoff:
            continue
        s = process_session(jsonl)
        if not s:
            continue
        if project_filter and project_filter not in s.project and project_filter not in str(s.path):
            continue
        results.append(s)
    return results


# ---------------- rendering ----------------

def fmt_tokens(n: int) -> str:
    if n >= 1_000_000:
        return f"{n/1_000_000:.2f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}k"
    return str(n)


def h1(s: str) -> None:
    print()
    print(s)
    print("=" * len(s))


def h2(s: str) -> None:
    print()
    print(s)
    print("-" * len(s))


def render(sessions: list[SessionStats], window_label: str) -> None:
    if not sessions:
        print(f"No sessions {window_label}. Check ~/.claude/projects/ exists.")
        return

    total_tokens = sum(s.total_tokens for s in sessions)
    total_input = sum(s.input_tokens for s in sessions)
    total_output = sum(s.output_tokens for s in sessions)
    total_cache_read = sum(s.cache_read_tokens for s in sessions)
    total_cache_create = sum(s.cache_creation_tokens for s in sessions)
    total_duration = sum(s.duration_min for s in sessions)
    overall_hit = (
        total_cache_read / (total_input + total_cache_read + total_cache_create)
        if (total_input + total_cache_read + total_cache_create) else 0.0
    )

    h1(f"Claude Code usage — {window_label}")
    print(f"Sessions:        {len(sessions)}")
    print(f"Projects:        {len({s.project for s in sessions})}")
    print(f"Total duration:  {total_duration:.1f} min")
    print(f"Total tokens:    {fmt_tokens(total_tokens)}")
    print(f"  input (fresh): {fmt_tokens(total_input)}")
    print(f"  output:        {fmt_tokens(total_output)}")
    print(f"  cache read:    {fmt_tokens(total_cache_read)}")
    print(f"  cache create:  {fmt_tokens(total_cache_create)}")
    print(f"Cache hit ratio: {overall_hit*100:.1f}%   (>80% is healthy; <50% means prompts/context churn)")

    # ---- by project ----
    by_project: dict[str, list[SessionStats]] = defaultdict(list)
    for s in sessions:
        by_project[s.project].append(s)

    h2("By project")
    print(f"{'project':<55} {'sessions':>8} {'tokens':>10} {'cache%':>7} {'dur(min)':>9}")
    rows = []
    for proj, slist in by_project.items():
        tok = sum(s.total_tokens for s in slist)
        cr = sum(s.cache_read_tokens for s in slist)
        denom = sum(s.input_tokens + s.cache_read_tokens + s.cache_creation_tokens for s in slist)
        hit = (cr / denom) if denom else 0.0
        dur = sum(s.duration_min for s in slist)
        rows.append((proj, len(slist), tok, hit, dur))
    rows.sort(key=lambda r: r[2], reverse=True)
    for proj, n, tok, hit, dur in rows:
        print(f"{proj[:55]:<55} {n:>8} {fmt_tokens(tok):>10} {hit*100:>6.1f}% {dur:>9.1f}")

    # ---- top sessions ----
    h2("Top 10 sessions by token spend")
    print(f"{'date':<17} {'project':<40} {'tokens':>9} {'cache%':>7} {'turns':>6} {'tools':>6}")
    top = sorted(sessions, key=lambda s: s.total_tokens, reverse=True)[:10]
    for s in top:
        date = s.first_ts.astimezone().strftime("%Y-%m-%d %H:%M") if s.first_ts else "?"
        tool_total = sum(s.tool_calls.values())
        print(f"{date:<17} {s.project[:40]:<40} {fmt_tokens(s.total_tokens):>9} "
              f"{s.cache_hit_ratio*100:>6.1f}% {s.assistant_turns:>6} {tool_total:>6}")

    # ---- tool mix ----
    h2("Tool-call mix (all sessions)")
    tool_total = Counter()
    for s in sessions:
        tool_total.update(s.tool_calls)
    grand = sum(tool_total.values()) or 1
    for name, n in tool_total.most_common(15):
        bar = "#" * int(40 * n / grand)
        print(f"  {name:<18} {n:>6}  {100*n/grand:>5.1f}%  {bar}")
    total_errors = sum(s.tool_errors for s in sessions)
    err_rate = 100 * total_errors / grand if grand else 0
    print(f"\n  Tool errors:      {total_errors}  ({err_rate:.1f}% of all tool calls)")
    print(f"  Bash commands:    {sum(s.bash_commands for s in sessions)}")
    print(f"  Subagent spawns:  {sum(s.subagent_spawns for s in sessions)}")
    print(f"  Web fetches:      {sum(s.web_fetch_requests for s in sessions)}")
    print(f"  Web searches:     {sum(s.web_search_requests for s in sessions)}")

    # ---- leak signal: files re-read many times ----
    h2("Leak signal — files Read >3x in a single session (top 15)")
    offenders: list[tuple[str, str, int]] = []  # (session_label, file, count)
    for s in sessions:
        for fp, n in s.file_reads.items():
            if n > 3:
                label = (s.first_ts.astimezone().strftime("%Y-%m-%d") if s.first_ts else s.session_id[:8]) + " " + s.project
                offenders.append((label, fp, n))
    offenders.sort(key=lambda r: r[2], reverse=True)
    if not offenders:
        print("  (none — good)")
    else:
        for label, fp, n in offenders[:15]:
            short_fp = fp if len(fp) < 70 else "…" + fp[-67:]
            print(f"  {n:>3}x  {short_fp}   [{label}]")

    # ---- leak signal: rework loops (files edited many times) ----
    h2("Rework signal — files Edited >5x in a single session (top 10)")
    rework: list[tuple[str, str, int]] = []
    for s in sessions:
        for fp, n in s.file_edits.items():
            if n > 5:
                label = (s.first_ts.astimezone().strftime("%Y-%m-%d") if s.first_ts else s.session_id[:8]) + " " + s.project
                rework.append((label, fp, n))
    rework.sort(key=lambda r: r[2], reverse=True)
    if not rework:
        print("  (none — good)")
    else:
        for label, fp, n in rework[:10]:
            short_fp = fp if len(fp) < 70 else "…" + fp[-67:]
            print(f"  {n:>3}x  {short_fp}   [{label}]")

    # ---- interpretation ----
    h2("Interpretation hints")
    hints = []
    if overall_hit < 0.5 and (total_input + total_cache_read + total_cache_create) > 0:
        hints.append(
            "Low cache hit ratio (<50%). You're probably starting many short sessions or "
            "shifting context mid-session. Try: fewer, longer sessions; avoid editing CLAUDE.md "
            "mid-flight; prefer /clear over quitting."
        )
    if err_rate > 5:
        hints.append(
            f"Tool error rate {err_rate:.1f}% is high. Look at the Bash/Edit failures — "
            "often a missing permission or an Edit without a prior Read."
        )
    if tool_total.get("Read", 0) > 2 * tool_total.get("Edit", 0) and tool_total.get("Read", 0) > 50:
        hints.append(
            "Read calls dominate Edit calls — a lot of exploration. Consider delegating "
            "exploration to the Explore subagent so it doesn't eat your main context."
        )
    if offenders:
        hints.append(
            "Same file Read many times per session = context loss. Likely caused by "
            "compaction or by the agent forgetting it already has the content. Try /clear + "
            "fresh session once a feature is done."
        )
    if sum(s.subagent_spawns for s in sessions) == 0 and len(sessions) >= 3:
        hints.append(
            "Zero subagent spawns across all sessions. For codebase-wide research, the "
            "Explore/Agent tools keep the main context small — worth trying."
        )
    if not hints:
        print("  Nothing obvious. Workflow looks clean.")
    else:
        for i, h in enumerate(hints, 1):
            print(f"  {i}. {h}")

    print()
    print("Reminder: this covers LOCAL sessions only. For $ cost and cross-device totals,")
    print("check console.anthropic.com → Usage.")


def render_json(sessions: list[SessionStats]) -> None:
    out = []
    for s in sessions:
        out.append({
            "session_id": s.session_id,
            "project": s.project,
            "path": str(s.path),
            "first_ts": s.first_ts.isoformat() if s.first_ts else None,
            "last_ts": s.last_ts.isoformat() if s.last_ts else None,
            "duration_min": round(s.duration_min, 2),
            "user_turns": s.user_turns,
            "assistant_turns": s.assistant_turns,
            "tokens": {
                "input": s.input_tokens,
                "output": s.output_tokens,
                "cache_read": s.cache_read_tokens,
                "cache_creation": s.cache_creation_tokens,
                "total": s.total_tokens,
            },
            "cache_hit_ratio": round(s.cache_hit_ratio, 4),
            "tool_calls": dict(s.tool_calls),
            "tool_errors": s.tool_errors,
            "bash_commands": s.bash_commands,
            "subagent_spawns": s.subagent_spawns,
            "web_fetch_requests": s.web_fetch_requests,
            "web_search_requests": s.web_search_requests,
            "files_read_gt3": {fp: n for fp, n in s.file_reads.items() if n > 3},
            "files_edited_gt5": {fp: n for fp, n in s.file_edits.items() if n > 5},
        })
    json.dump(out, sys.stdout, indent=2)
    print()


def main() -> int:
    ap = argparse.ArgumentParser(description="Claude Code local usage report")
    window = ap.add_mutually_exclusive_group()
    window.add_argument("--days", type=int, default=None, help="Look-back window in days (default: 7 if --since not given)")
    window.add_argument("--since", type=parse_since, default=None, help="Absolute cutoff date, e.g. 2026-11-01")
    ap.add_argument("--project", type=str, default=None, help="Substring filter on project label or path")
    ap.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = ap.parse_args()

    if args.since is not None:
        cutoff = args.since
        window_label = f"since {args.since.astimezone().strftime('%Y-%m-%d')}"
    else:
        days = args.days if args.days is not None else 7
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        window_label = f"last {days} days"

    sessions = collect(cutoff, args.project)

    if args.json:
        render_json(sessions)
    else:
        render(sessions, window_label)
    return 0


if __name__ == "__main__":
    sys.exit(main())
