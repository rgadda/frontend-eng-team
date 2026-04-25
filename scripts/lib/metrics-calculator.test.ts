import { describe, expect, it } from 'vitest';
import { SAMPLE_PRS } from './__fixtures__/sample-prs.js';
import {
  computeChange,
  computePeriodMetrics,
  mean,
  median,
  partitionPRs,
  percentile,
  topContributors,
} from './metrics-calculator.js';

describe('median', () => {
  it('returns 0 for empty input', () => {
    expect(median([])).toBe(0);
  });

  it('returns the middle value for odd-length arrays', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('averages the two middle values for even-length arrays', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('does not mutate the input array', () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe('percentile', () => {
  it('returns 0 for empty input', () => {
    expect(percentile([], 90)).toBe(0);
  });

  it('returns the min for p=0 and max for p=100', () => {
    expect(percentile([5, 1, 9, 3], 0)).toBe(1);
    expect(percentile([5, 1, 9, 3], 100)).toBe(9);
  });

  it('computes p50 equal to the median for an odd-length array', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it('computes p90 with linear interpolation', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(values, 90)).toBe(9.1);
  });
});

describe('mean', () => {
  it('returns 0 for empty input', () => {
    expect(mean([])).toBe(0);
  });

  it('computes the arithmetic mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });
});

describe('partitionPRs', () => {
  const periodStart = new Date('2026-03-28T00:00:00Z');
  const baselineEnd = new Date('2026-04-11T00:00:00Z');
  const periodEnd = new Date('2026-04-25T00:00:00Z');

  it('splits PRs at the baseline boundary', () => {
    const { baseline, comparison } = partitionPRs(
      SAMPLE_PRS,
      periodStart,
      baselineEnd,
      periodEnd,
    );
    expect(baseline.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(comparison.map((p) => p.number)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it('treats the baseline boundary as inclusive of the comparison side', () => {
    const onBoundary = [
      {
        ...SAMPLE_PRS[0],
        number: 999,
        mergedAt: '2026-04-11T00:00:00Z',
      },
    ];
    const { baseline, comparison } = partitionPRs(
      onBoundary,
      periodStart,
      baselineEnd,
      periodEnd,
    );
    expect(baseline).toHaveLength(0);
    expect(comparison).toHaveLength(1);
  });

  it('excludes PRs outside the full period', () => {
    const outOfRange = [
      { ...SAMPLE_PRS[0], number: 100, mergedAt: '2026-03-01T00:00:00Z' },
      { ...SAMPLE_PRS[0], number: 101, mergedAt: '2026-05-01T00:00:00Z' },
    ];
    const { baseline, comparison } = partitionPRs(
      outOfRange,
      periodStart,
      baselineEnd,
      periodEnd,
    );
    expect(baseline).toHaveLength(0);
    expect(comparison).toHaveLength(0);
  });
});

describe('computePeriodMetrics', () => {
  it('returns zeroed metrics for empty input', () => {
    const m = computePeriodMetrics([], 14);
    expect(m.totalPRs).toBe(0);
    expect(m.prsPerEngineerPerWeek).toBe(0);
    expect(m.medianTimeToMergeHours).toBe(0);
    expect(m.uniqueContributors).toBe(0);
  });

  it('computes correct metrics for the baseline window of the fixture', () => {
    const baseline = SAMPLE_PRS.slice(0, 6);
    const m = computePeriodMetrics(baseline, 14);
    expect(m.totalPRs).toBe(6);
    expect(m.uniqueContributors).toBe(4);
    expect(m.prsPerEngineerPerWeek).toBe(0.75);
    expect(m.medianTimeToMergeHours).toBeGreaterThan(0);
    expect(m.p90TimeToMergeHours).toBeGreaterThanOrEqual(
      m.medianTimeToMergeHours,
    );
    expect(m.avgPRSize).toBeGreaterThan(0);
    expect(m.medianPRSize).toBeGreaterThan(0);
  });
});

describe('computeChange', () => {
  it('handles a zero baseline without producing NaN or Infinity', () => {
    const baseline = computePeriodMetrics([], 14);
    const comparison = computePeriodMetrics(SAMPLE_PRS.slice(6), 14);
    const change = computeChange(baseline, comparison);
    expect(Number.isFinite(change.throughputMultiplier)).toBe(true);
    expect(Number.isFinite(change.mergeTimeChangePct)).toBe(true);
    expect(Number.isFinite(change.prSizeChangePct)).toBe(true);
    expect(Number.isFinite(change.reviewDepthChangePct)).toBe(true);
  });

  it('produces a positive multiplier when comparison throughput exceeds baseline', () => {
    const baseline = computePeriodMetrics(SAMPLE_PRS.slice(0, 2), 14);
    const comparison = computePeriodMetrics(SAMPLE_PRS.slice(6), 14);
    const change = computeChange(baseline, comparison);
    expect(change.throughputMultiplier).toBeGreaterThan(1);
  });

  it('produces negative pct change when median size shrinks', () => {
    const big = [{ ...SAMPLE_PRS[3] }];
    const small = [{ ...SAMPLE_PRS[0] }];
    const baseline = computePeriodMetrics(big, 14);
    const comparison = computePeriodMetrics(small, 14);
    const change = computeChange(baseline, comparison);
    expect(change.prSizeChangePct).toBeLessThan(0);
  });
});

describe('topContributors', () => {
  it('orders by PR count desc and limits the result', () => {
    const top = topContributors(SAMPLE_PRS, 3);
    expect(top).toHaveLength(3);
    for (let i = 1; i < top.length; i += 1) {
      expect(top[i - 1].prs).toBeGreaterThanOrEqual(top[i].prs);
    }
  });

  it('breaks ties alphabetically by author name', () => {
    const top = topContributors(SAMPLE_PRS, 10);
    const tied = top.filter((c) => c.prs === top[0].prs);
    if (tied.length > 1) {
      const names = tied.map((c) => c.author);
      expect(names).toEqual([...names].sort());
    }
  });
});
