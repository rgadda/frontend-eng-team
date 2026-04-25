import type {
  ChangeMetrics,
  ContributorStats,
  PeriodMetrics,
  RawPR,
} from './types.js';

const round1 = (n: number): number => Math.round(n * 10) / 10;
const round2 = (n: number): number => Math.round(n * 100) / 100;

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  if (p <= 0) return Math.min(...values);
  if (p >= 100) return Math.max(...values);
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  let total = 0;
  for (const v of values) total += v;
  return total / values.length;
};

export interface PartitionedPRs {
  baseline: RawPR[];
  comparison: RawPR[];
}

export const partitionPRs = (
  prs: RawPR[],
  periodStart: Date,
  baselineEnd: Date,
  periodEnd: Date,
): PartitionedPRs => {
  const startMs = periodStart.getTime();
  const splitMs = baselineEnd.getTime();
  const endMs = periodEnd.getTime();
  const baseline: RawPR[] = [];
  const comparison: RawPR[] = [];
  for (const p of prs) {
    const t = new Date(p.mergedAt).getTime();
    if (t < startMs || t >= endMs) continue;
    if (t < splitMs) baseline.push(p);
    else comparison.push(p);
  }
  return { baseline, comparison };
};

const EMPTY_PERIOD_METRICS: PeriodMetrics = {
  totalPRs: 0,
  prsPerEngineerPerWeek: 0,
  medianTimeToMergeHours: 0,
  p90TimeToMergeHours: 0,
  avgPRSize: 0,
  medianPRSize: 0,
  avgReviewComments: 0,
  avgFilesChanged: 0,
  uniqueContributors: 0,
};

export const computePeriodMetrics = (
  prs: RawPR[],
  days: number,
): PeriodMetrics => {
  if (prs.length === 0) return { ...EMPTY_PERIOD_METRICS };

  const mergeTimes = prs.map((p) => p.timeToMergeHours);
  const sizes = prs.map((p) => p.totalLinesChanged);
  const reviewCounts = prs.map((p) => p.reviewComments);
  const fileCounts = prs.map((p) => p.changedFiles);
  const authors = new Set(prs.map((p) => p.author));

  const weeks = days > 0 ? days / 7 : 0;
  const prsPerEngPerWeek =
    authors.size > 0 && weeks > 0 ? prs.length / authors.size / weeks : 0;

  return {
    totalPRs: prs.length,
    prsPerEngineerPerWeek: round2(prsPerEngPerWeek),
    medianTimeToMergeHours: round1(median(mergeTimes)),
    p90TimeToMergeHours: round1(percentile(mergeTimes, 90)),
    avgPRSize: Math.round(mean(sizes)),
    medianPRSize: Math.round(median(sizes)),
    avgReviewComments: round1(mean(reviewCounts)),
    avgFilesChanged: round1(mean(fileCounts)),
    uniqueContributors: authors.size,
  };
};

const pctChange = (baseline: number, comparison: number): number => {
  if (baseline === 0) return 0;
  return Math.round(((comparison - baseline) / baseline) * 100);
};

export const computeChange = (
  baseline: PeriodMetrics,
  comparison: PeriodMetrics,
): ChangeMetrics => ({
  throughputMultiplier:
    baseline.prsPerEngineerPerWeek === 0
      ? 0
      : round1(comparison.prsPerEngineerPerWeek / baseline.prsPerEngineerPerWeek),
  mergeTimeChangeHours: round1(
    comparison.medianTimeToMergeHours - baseline.medianTimeToMergeHours,
  ),
  mergeTimeChangePct: pctChange(
    baseline.medianTimeToMergeHours,
    comparison.medianTimeToMergeHours,
  ),
  prSizeChangePct: pctChange(baseline.medianPRSize, comparison.medianPRSize),
  reviewDepthChangePct: pctChange(
    baseline.avgReviewComments,
    comparison.avgReviewComments,
  ),
});

export const topContributors = (
  prs: RawPR[],
  limit: number,
): ContributorStats[] => {
  const byAuthor = new Map<string, RawPR[]>();
  for (const p of prs) {
    const list = byAuthor.get(p.author);
    if (list) list.push(p);
    else byAuthor.set(p.author, [p]);
  }
  const stats: ContributorStats[] = [];
  for (const [author, authorPrs] of byAuthor) {
    stats.push({
      author,
      prs: authorPrs.length,
      avgMergeTimeHours: round1(
        mean(authorPrs.map((p) => p.timeToMergeHours)),
      ),
      avgSize: Math.round(mean(authorPrs.map((p) => p.totalLinesChanged))),
    });
  }
  stats.sort((a, b) => {
    if (b.prs !== a.prs) return b.prs - a.prs;
    return a.author.localeCompare(b.author);
  });
  return stats.slice(0, limit);
};
