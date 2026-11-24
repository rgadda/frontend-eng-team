# Metrics Collection Guide

> What to collect, where to get it, and when — so you have the data to prove your workflow works.

---

## Before You Start: Establish the Baseline

You cannot show improvement without a "before" snapshot. Collect baseline metrics **before** rolling out the multi-agent pipeline to the team. The baseline period should be 2-4 weeks of normal development activity.

**Action items:**
- [ ] Pick a baseline window (minimum 2 full sprints)
- [ ] Export or snapshot all metrics listed below during that window
- [ ] Store the baseline data somewhere durable (spreadsheet, dashboard, or doc) — you will reference it in every subsequent report

---

## Metrics to Collect

### Category 1: PR Velocity

These measure whether the team is shipping faster.

| # | Metric | Source | How to Collect | Frequency |
|---|---|---|---|---|
| 1 | **PRs merged per engineer per week** | GitHub/GitLab | API query or dashboard (e.g., LinearB, Sleuth, Pluralsight Flow) | Weekly |
| 2 | **Median time from PR open to merge** | GitHub/GitLab | Same tooling — use median, not average (outliers skew averages) | Weekly |
| 3 | **Median time from first commit to PR open** | Git + project tool | Compare first commit timestamp to PR creation timestamp | Weekly |
| 4 | **Time from task assignment to first PR** | Jira/Linear/Shortcut + GitHub | Correlate ticket transition dates with PR creation | Weekly |
| 5 | **PR size (lines changed, files touched)** | GitHub/GitLab | API or dashboard — track trends, not absolutes | Weekly |

**What to watch for:**
- PRs merged should increase or hold steady while PR size stays constant or decreases (more, smaller PRs = healthier)
- Time-to-merge should decrease — this is the single most visible metric to leadership
- If PR size balloons, the pipeline may be encouraging too-large changes — adjust the Architect's planning granularity

---

### Category 2: Code Quality

These measure whether faster also means better.

| # | Metric | Source | How to Collect | Frequency |
|---|---|---|---|---|
| 6 | **Post-merge bug rate** | Bug tracker (Jira/Linear) | Tag bugs by "found in code written during [period]" — requires discipline in bug triage | Biweekly |
| 7 | **Production incidents traced to recent code** | Incident tracker / PagerDuty | Correlate incident root cause with recent PRs | Monthly |
| 8 | **Review comments per PR** | GitHub/GitLab | API query — separate human comments from bot comments | Weekly |
| 9 | **Review comment categories** | Manual or AI-assisted | Categorize a sample of review comments: mechanical (style/lint), structural (architecture), logical (bug/edge case) | Biweekly |
| 10 | **CI failure rate on PRs** | CI system (GitHub Actions, CircleCI, etc.) | Track % of PRs that fail CI at least once before merge | Weekly |
| 11 | **Type error count in CI** | TypeScript compiler output in CI | Parse CI logs for tsc errors over time | Weekly |
| 12 | **Test coverage delta** | CI coverage tool (Istanbul, Codecov, etc.) | Compare coverage % at baseline vs. post-adoption — track per-PR coverage of new code specifically | Biweekly |
| 13 | **Revert rate** | Git history | Count `git revert` commits or reverted PRs per sprint | Per sprint |

**What to watch for:**
- Review comments should shift from mechanical (caught by Verifier) to structural/logical (human value-add)
- Post-merge bug rate is the ultimate quality signal but has a 4-8 week lag — be patient
- If CI failure rate increases, the Implementer constraints may need tightening

---

### Category 3: Pipeline Effectiveness

These measure whether the multi-agent system itself is working as designed.

| # | Metric | Source | How to Collect | Frequency |
|---|---|---|---|---|
| 14 | **Pipeline runs per week (team total)** | Command/session logs or self-report | If tooling supports logging, automate it; otherwise use a shared tally | Weekly |
| 15 | **Pipeline runs per engineer per week** | Same as above, per person | Breakdown of #14 | Weekly |
| 16 | **Verifier first-pass rate** | Pipeline output | % of pipeline runs where Verifier returns PASS on first attempt (no loops) | Weekly |
| 17 | **Average Verifier loops before PASS** | Pipeline output | Mean number of Implementer->Reviewer->Verifier cycles per task | Weekly |
| 18 | **Pipeline stall rate** | Pipeline output | % of runs that hit the 3-loop limit and escalate to human | Weekly |
| 19 | **Role skip rate** | Observation | How often engineers skip a role (e.g., go straight to /implement without /architect) | Biweekly |
| 20 | **Repos with project identity files** | File search across org repos | `find . -name "CLAUDE.md"` or equivalent across repos | Monthly |

**What to watch for:**
- First-pass rate should be >70% after the first month — if it's lower, the Architect plans may be too vague
- Pipeline stall rate should be <10% — if higher, the Verifier checklist may be too strict or the constraints unrealistic
- Role skip rate reveals adoption gaps — if engineers routinely skip the Architect, they're not seeing planning value

---

### Category 4: Adoption & Satisfaction

These measure whether the team actually wants to use the system.

| # | Metric | Source | How to Collect | Frequency |
|---|---|---|---|---|
| 21 | **Active pipeline users (% of team)** | Self-report or logs | "Did you use the pipeline this week?" — binary per engineer | Weekly |
| 22 | **Developer satisfaction score** | Anonymous survey | "On a scale of 1-5, how productive do you feel with the current AI workflow?" | Biweekly |
| 23 | **Cognitive load score** | Anonymous survey | "On a scale of 1-5, does the pipeline reduce or add to your mental overhead?" (1 = adds a lot, 5 = reduces a lot) | Biweekly |
| 24 | **Trust in AI output** | Anonymous survey | "On a scale of 1-5, how confident are you in code that went through the pipeline?" | Biweekly |
| 25 | **Net Promoter Score (internal)** | Anonymous survey | "Would you recommend this workflow to another team?" (0-10 scale) | Monthly |
| 26 | **Unprompted usage** | Observation | Are engineers using the pipeline without being asked? Or only when reminded? | Ongoing |
| 27 | **New engineer onboarding time** | Onboarding tracking | How long until a new team member runs their first pipeline independently? | Per new hire |

**What to watch for:**
- Satisfaction and cognitive load scores that drop after initial enthusiasm signal a workflow design problem — investigate immediately
- Unprompted usage is the strongest signal of genuine value — if engineers choose the pipeline when nobody is watching, it's working
- NPS below 7 means the system is tolerated, not valued — dig into why

---

### Category 5: Business Impact (for Leadership)

These translate engineering metrics into business language.

| # | Metric | Derived From | How to Calculate | Frequency |
|---|---|---|---|---|
| 28 | **Engineering throughput multiplier** | PRs merged before vs. after | (Post-adoption PRs/week) / (Baseline PRs/week) | Monthly |
| 29 | **Review cycle time savings** | Time-to-merge before vs. after | (Baseline median) - (Post-adoption median) in hours | Monthly |
| 30 | **Estimated hours saved per week** | Review time + boilerplate time | Survey engineers: "How many hours per week does the pipeline save you?" — aggregate | Monthly |
| 31 | **Quality-adjusted velocity** | Throughput multiplier adjusted for bug rate | If throughput 2x but bugs also 2x, quality-adjusted = 1x. If throughput 2x and bugs flat, quality-adjusted = 2x | Quarterly |
| 32 | **Cost per PR** | Tool license costs / PRs merged | (Monthly AI tool spend) / (PRs merged that month) — compare to pre-adoption | Monthly |

---

## Collection Tools & Setup

### Automated (Recommended)

| Tool | What It Collects | Setup Effort |
|---|---|---|
| **LinearB / Sleuth / Pluralsight Flow** | Metrics 1-5, 8, 10, 13 | Connect to GitHub + project tool (1-2 hrs) |
| **Codecov / Istanbul** | Metric 12 | Already in most CI pipelines |
| **GitHub API scripts** | Metrics 1-2, 5, 8 | Custom script, ~2 hrs to write |
| **CI log parsing** | Metrics 10-11 | Custom script or dashboard, ~1 hr |

### Manual (Minimum Viable)

If you don't want to set up tooling, you can collect the most critical metrics manually:

| Metric | Manual Method | Time per Week |
|---|---|---|
| PRs merged per engineer | Count from GitHub PR list, filter by author + date | 10 min |
| Median time-to-merge | Sample 10 PRs, note open/merge timestamps, take median | 15 min |
| Pipeline runs | Shared spreadsheet — each engineer logs pipeline usage | 2 min/engineer |
| Satisfaction + cognitive load | Google Form with 3 questions, sent biweekly | 5 min to create, 2 min/engineer to fill |

**Total manual overhead: ~30 min/week for the tech lead, ~5 min/week per engineer.**

---

## Reporting Template

Use this structure for weekly/biweekly reports:

```
## AI Dev Workflow — Metrics Report (Week of [date])

### Headlines
- [One sentence: most important improvement]
- [One sentence: most important concern or watch item]

### Velocity
- PRs merged: [X] (baseline: [Y], change: [+/- Z%])
- Median time-to-merge: [X hrs] (baseline: [Y hrs])

### Quality
- Post-merge bugs this period: [X] (baseline average: [Y])
- Revert rate: [X%] (baseline: [Y%])

### Pipeline Health
- Pipeline runs this week: [X]
- Verifier first-pass rate: [X%]
- Active users: [X/Y engineers]

### Team Sentiment
- Satisfaction: [X/5] (previous: [Y/5])
- Cognitive load: [X/5] (previous: [Y/5])

### Actions
- [What to adjust based on this data]
```

---

## Metric Priority for First Engagement

If you're limited on time, collect these 8 metrics and nothing else:

| Priority | Metric | Why |
|---|---|---|
| 1 | PRs merged per engineer per week | Most visible velocity signal |
| 2 | Median time from PR open to merge | Leadership cares about this number |
| 3 | Active pipeline users (% of team) | Proves adoption, not just availability |
| 4 | Verifier first-pass rate | Proves the system is working mechanically |
| 5 | Developer satisfaction score | Proves engineers like it, not just tolerate it |
| 6 | Post-merge bug rate | Proves quality didn't suffer (4-8 week lag) |
| 7 | Review comments per PR | Shows shift from mechanical to high-value review |
| 8 | Estimated hours saved per week | The ROI number leadership will quote |
