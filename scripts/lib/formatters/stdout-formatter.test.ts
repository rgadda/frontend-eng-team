import { describe, expect, it } from 'vitest';
import { SAMPLE_PRS } from '../__fixtures__/sample-prs.js';
import {
  computeChange,
  computePeriodMetrics,
  topContributors,
} from '../metrics-calculator.js';
import type { ReportData } from '../types.js';
import { formatStdout } from './stdout-formatter.js';

const makeReport = (): ReportData => {
  const baselinePrs = SAMPLE_PRS.slice(0, 6);
  const comparisonPrs = SAMPLE_PRS.slice(6);
  const baselineMetrics = computePeriodMetrics(baselinePrs, 14);
  const comparisonMetrics = computePeriodMetrics(comparisonPrs, 14);
  return {
    repo: 'acme/web-app',
    generatedAt: '2026-04-25T10:30:00Z',
    period: { start: '2026-03-28', end: '2026-04-25', days: 28 },
    baseline: {
      window: { start: '2026-03-28', end: '2026-04-11', days: 14 },
      metrics: baselineMetrics,
    },
    comparison: {
      window: { start: '2026-04-11', end: '2026-04-25', days: 14 },
      metrics: comparisonMetrics,
    },
    change: computeChange(baselineMetrics, comparisonMetrics),
    prs: SAMPLE_PRS,
  };
};

describe('formatStdout', () => {
  it('renders the four required section headers', () => {
    const out = formatStdout(makeReport(), topContributors(SAMPLE_PRS, 4));
    expect(out).toContain('--- VELOCITY ---');
    expect(out).toContain('--- PR SIZE ---');
    expect(out).toContain('--- REVIEW ---');
    expect(out).toContain('--- TOP CONTRIBUTORS ---');
  });

  it('starts with the report title and date ranges', () => {
    const out = formatStdout(makeReport(), topContributors(SAMPLE_PRS, 4));
    const firstLine = out.split('\n')[0];
    expect(firstLine).toBe('PR Metrics Report: acme/web-app');
    expect(out).toContain('Period: 2026-03-28 to 2026-04-25 (28 days)');
    expect(out).toContain('Baseline: 2026-03-28 to 2026-04-11 (14 days)');
    expect(out).toContain('Comparison: 2026-04-11 to 2026-04-25 (14 days)');
  });

  it('includes baseline and comparison columns with the contributor list', () => {
    const out = formatStdout(makeReport(), topContributors(SAMPLE_PRS, 4));
    expect(out).toContain('Baseline');
    expect(out).toContain('Comparison');
    expect(out).toMatch(/@alice/);
    expect(out).toMatch(/lines/);
  });

  it('renders an empty contributors fallback when none are supplied', () => {
    const out = formatStdout(makeReport(), []);
    expect(out).toContain('(no PRs in period)');
  });

  it('shows a multiplier (e.g. 2.3x) for throughput change', () => {
    const out = formatStdout(makeReport(), topContributors(SAMPLE_PRS, 4));
    expect(out).toMatch(/\d+(\.\d+)?x/);
  });

  it('shows -- when both baseline and comparison are zero', () => {
    const empty = computePeriodMetrics([], 14);
    const data: ReportData = {
      repo: 'acme/empty',
      generatedAt: '2026-04-25T10:30:00Z',
      period: { start: '2026-03-28', end: '2026-04-25', days: 28 },
      baseline: {
        window: { start: '2026-03-28', end: '2026-04-11', days: 14 },
        metrics: empty,
      },
      comparison: {
        window: { start: '2026-04-11', end: '2026-04-25', days: 14 },
        metrics: empty,
      },
      change: computeChange(empty, empty),
      prs: [],
    };
    const out = formatStdout(data, []);
    expect(out).toContain('--');
  });
});
