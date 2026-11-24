# PR Data Tracking

> Fill in this table weekly. The baseline period (before pipeline adoption) is your comparison point for all future measurements.

---

## How to Collect This Data

**From GitHub (no tools needed):**
- Go to your repo > Pull Requests > Closed
- Filter by date range and author
- PR open/merge timestamps are visible on each PR
- Review comments count is on each PR's conversation tab

**From your terminal:**
```bash
# PRs merged this week by author
gh pr list --state merged --search "merged:>2026-04-21" --json author,mergedAt,title,additions,deletions

# Average PR size (lines changed) for last 20 merged PRs
gh pr list --state merged --limit 20 --json additions,deletions

# Time from open to merge for recent PRs
gh pr list --state merged --limit 20 --json createdAt,mergedAt,title
```

**Time estimate:** ~15-20 minutes per week to fill in manually.

---

## Weekly PR Velocity Tracker

| Week | Dates | PRs Merged (Total) | PRs Merged (Per Engineer Avg) | Median Time to Merge (hrs) | Avg PR Size (lines changed) | Notes |
|---|---|---|---|---|---|---|
| Baseline 1 | ____/____/____ - ____/____/____ | | | | | Pre-pipeline |
| Baseline 2 | ____/____/____ - ____/____/____ | | | | | Pre-pipeline |
| Baseline 3 | ____/____/____ - ____/____/____ | | | | | Pre-pipeline (optional) |
| Week 1 | ____/____/____ - ____/____/____ | | | | | First week with pipeline |
| Week 2 | ____/____/____ - ____/____/____ | | | | | |
| Week 3 | ____/____/____ - ____/____/____ | | | | | |
| Week 4 | ____/____/____ - ____/____/____ | | | | | |
| Week 5 | ____/____/____ - ____/____/____ | | | | | |
| Week 6 | ____/____/____ - ____/____/____ | | | | | |
| Week 7 | ____/____/____ - ____/____/____ | | | | | |
| Week 8 | ____/____/____ - ____/____/____ | | | | | |

---

## Code Quality Tracker

| Week | Dates | Review Comments per PR (Avg) | Post-Merge Bugs | Reverts | CI Failures on PRs | Test Coverage Delta |
|---|---|---|---|---|---|---|
| Baseline 1 | ____/____/____ - ____/____/____ | | | | | |
| Baseline 2 | ____/____/____ - ____/____/____ | | | | | |
| Week 1 | ____/____/____ - ____/____/____ | | | | | |
| Week 2 | ____/____/____ - ____/____/____ | | | | | |
| Week 3 | ____/____/____ - ____/____/____ | | | | | |
| Week 4 | ____/____/____ - ____/____/____ | | | | | |
| Week 5 | ____/____/____ - ____/____/____ | | | | | |
| Week 6 | ____/____/____ - ____/____/____ | | | | | |
| Week 7 | ____/____/____ - ____/____/____ | | | | | |
| Week 8 | ____/____/____ - ____/____/____ | | | | | |

---

## Pipeline Effectiveness Tracker

| Week | Dates | Pipeline Runs (Total) | Verifier First-Pass Rate (%) | Avg Loops Before PASS | Pipeline Stalls | Role Skips Observed |
|---|---|---|---|---|---|---|
| Week 1 | ____/____/____ - ____/____/____ | | | | | |
| Week 2 | ____/____/____ - ____/____/____ | | | | | |
| Week 3 | ____/____/____ - ____/____/____ | | | | | |
| Week 4 | ____/____/____ - ____/____/____ | | | | | |
| Week 5 | ____/____/____ - ____/____/____ | | | | | |
| Week 6 | ____/____/____ - ____/____/____ | | | | | |
| Week 7 | ____/____/____ - ____/____/____ | | | | | |
| Week 8 | ____/____/____ - ____/____/____ | | | | | |

---

## Team Adoption & Satisfaction Tracker

| Week | Dates | Active Pipeline Users (X/Y) | Satisfaction (1-5) | Cognitive Load (1-5) | Trust in Output (1-5) | Notes / Feedback |
|---|---|---|---|---|---|---|
| Week 1 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 2 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 3 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 4 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 5 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 6 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 7 | ____/____/____ - ____/____/____ | /   | | | | |
| Week 8 | ____/____/____ - ____/____/____ | /   | | | | |

**Satisfaction scale:** 1 = significantly less productive, 3 = no change, 5 = significantly more productive
**Cognitive load scale:** 1 = adds a lot of overhead, 3 = neutral, 5 = reduces a lot of overhead
**Trust scale:** 1 = don't trust pipeline output at all, 3 = trust as much as manual, 5 = trust more than manual

---

## Business Impact Summary (Fill Monthly)

| Month | PRs/Week Baseline | PRs/Week Current | Throughput Multiplier | Median Merge Time Baseline | Median Merge Time Current | Time Saved | Est. Hours Saved/Week | Post-Merge Bug Trend |
|---|---|---|---|---|---|---|---|---|
| Month 1 | | | x | hrs | hrs | hrs | | |
| Month 2 | | | x | hrs | hrs | hrs | | |
| Month 3 | | | x | hrs | hrs | hrs | | |

**Throughput multiplier** = Current PRs/week / Baseline PRs/week
**Time saved** = Baseline merge time - Current merge time
**Est. hours saved** = Ask each engineer: "How many hours per week does the pipeline save you?" — average it

---

## Your Pitch Numbers (Fill Once You Have 2+ Weeks of Data)

Use these in LinkedIn posts, outreach messages, and discovery calls:

- "PR throughput: _____ PRs/week baseline --> _____ PRs/week with pipeline (____x improvement)"
- "Review cycle time: _____ hours baseline --> _____ hours with pipeline (____% reduction)"
- "Team adoption: ____/_____ engineers using the pipeline actively within ____ weeks"
- "Verifier first-pass rate: ____% (measures plan quality and implementation discipline)"
- "Estimated hours saved per engineer per week: _____"

---

## Recommended Tool Per Stage

| Your Stage | Best Tool | Why |
|---|---|---|
| **Now (collecting your own data)** | Manual + `gh` CLI commands above | Fastest to start, no setup, enough for pitch numbers |
| **First client engagement** | Manual tracking table (this file) | Low overhead, client owns the data, no vendor dependency |
| **Clients with 10+ engineers** | LinearB free tier | Automated collection, dashboards, DORA metrics — worth the 15-min setup |
| **Enterprise clients** | Pluralsight Flow or Jellyfish | Leadership dashboards, portfolio-level metrics, executive reporting |
