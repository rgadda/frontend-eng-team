import type {
  ContributorStats,
  PeriodMetrics,
  PeriodWindow,
  ReportData,
} from '../types.js';

const COL = { label: 24, baseline: 12, comparison: 14 } as const;

const padCol = (s: string, width: number): string => s.padEnd(width, ' ');

const fmtPctSigned = (baseline: number, comparison: number): string => {
  if (baseline === 0 && comparison === 0) return '--';
  if (baseline === 0) return 'n/a';
  const pct = Math.round(((comparison - baseline) / baseline) * 100);
  if (pct === 0) return '--';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
};

const fmtMultiplier = (baseline: number, comparison: number): string => {
  if (baseline === 0 && comparison === 0) return '--';
  if (baseline === 0) return 'n/a';
  const x = Math.round((comparison / baseline) * 10) / 10;
  return `${x}x`;
};

const fmtHours = (n: number): string => `${n.toFixed(1)} hrs`;

const fmtNum = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);

const row = (
  label: string,
  baseline: string,
  comparison: string,
  change: string,
): string =>
  `${padCol(label, COL.label)}${padCol(baseline, COL.baseline)}${padCol(
    comparison,
    COL.comparison,
  )}${change}`;

const headerRow = row('', 'Baseline', 'Comparison', 'Change');

const formatVelocity = (b: PeriodMetrics, c: PeriodMetrics): string[] => [
  '--- VELOCITY ---',
  headerRow,
  row(
    'PRs merged',
    String(b.totalPRs),
    String(c.totalPRs),
    fmtPctSigned(b.totalPRs, c.totalPRs),
  ),
  row(
    'PRs/engineer/week',
    fmtNum(b.prsPerEngineerPerWeek),
    fmtNum(c.prsPerEngineerPerWeek),
    fmtMultiplier(b.prsPerEngineerPerWeek, c.prsPerEngineerPerWeek),
  ),
  row(
    'Median time to merge',
    fmtHours(b.medianTimeToMergeHours),
    fmtHours(c.medianTimeToMergeHours),
    fmtPctSigned(b.medianTimeToMergeHours, c.medianTimeToMergeHours),
  ),
  row(
    'P90 time to merge',
    fmtHours(b.p90TimeToMergeHours),
    fmtHours(c.p90TimeToMergeHours),
    fmtPctSigned(b.p90TimeToMergeHours, c.p90TimeToMergeHours),
  ),
];

const formatSize = (b: PeriodMetrics, c: PeriodMetrics): string[] => [
  '',
  '--- PR SIZE ---',
  headerRow,
  row(
    'Avg lines changed',
    String(b.avgPRSize),
    String(c.avgPRSize),
    fmtPctSigned(b.avgPRSize, c.avgPRSize),
  ),
  row(
    'Median lines changed',
    String(b.medianPRSize),
    String(c.medianPRSize),
    fmtPctSigned(b.medianPRSize, c.medianPRSize),
  ),
  row(
    'Avg files changed',
    fmtNum(b.avgFilesChanged),
    fmtNum(c.avgFilesChanged),
    fmtPctSigned(b.avgFilesChanged, c.avgFilesChanged),
  ),
];

const formatReview = (b: PeriodMetrics, c: PeriodMetrics): string[] => [
  '',
  '--- REVIEW ---',
  headerRow,
  row(
    'Avg review comments',
    fmtNum(b.avgReviewComments),
    fmtNum(c.avgReviewComments),
    fmtPctSigned(b.avgReviewComments, c.avgReviewComments),
  ),
  row(
    'Unique contributors',
    String(b.uniqueContributors),
    String(c.uniqueContributors),
    fmtPctSigned(b.uniqueContributors, c.uniqueContributors),
  ),
];

const formatContributors = (contributors: ContributorStats[]): string[] => {
  const lines: string[] = ['', '--- TOP CONTRIBUTORS ---'];
  lines.push(
    `${padCol('Author', 16)}${padCol('PRs', 8)}${padCol(
      'Avg Merge Time',
      18,
    )}Avg Size`,
  );
  if (contributors.length === 0) {
    lines.push('(no PRs in period)');
    return lines;
  }
  for (const c of contributors) {
    lines.push(
      `${padCol(`@${c.author}`, 16)}${padCol(String(c.prs), 8)}${padCol(
        fmtHours(c.avgMergeTimeHours),
        18,
      )}${c.avgSize} lines`,
    );
  }
  return lines;
};

const formatHeader = (
  repo: string,
  period: PeriodWindow,
  baseline: PeriodWindow,
  comparison: PeriodWindow,
): string[] => [
  `PR Metrics Report: ${repo}`,
  `Period: ${period.start} to ${period.end} (${period.days} days)`,
  `Baseline: ${baseline.start} to ${baseline.end} (${baseline.days} days)`,
  `Comparison: ${comparison.start} to ${comparison.end} (${comparison.days} days)`,
  '',
];

export const formatStdout = (
  data: ReportData,
  contributors: ContributorStats[],
): string => {
  const lines: string[] = [
    ...formatHeader(
      data.repo,
      data.period,
      data.baseline.window,
      data.comparison.window,
    ),
    ...formatVelocity(data.baseline.metrics, data.comparison.metrics),
    ...formatSize(data.baseline.metrics, data.comparison.metrics),
    ...formatReview(data.baseline.metrics, data.comparison.metrics),
    ...formatContributors(contributors),
  ];
  return lines.join('\n');
};
