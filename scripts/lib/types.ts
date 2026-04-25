export type OutputFormat = 'stdout' | 'json' | 'csv';

export interface CLIOptions {
  repo: string;
  days: number;
  baselineDays: number;
  output: OutputFormat;
  token: string;
}

export interface RawPR {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string;
  timeToMergeHours: number;
  additions: number;
  deletions: number;
  totalLinesChanged: number;
  changedFiles: number;
  reviewComments: number;
  totalComments: number;
  reviewers: string[];
  labels: string[];
}

export interface PeriodWindow {
  start: string;
  end: string;
  days: number;
}

export interface PeriodMetrics {
  totalPRs: number;
  prsPerEngineerPerWeek: number;
  medianTimeToMergeHours: number;
  p90TimeToMergeHours: number;
  avgPRSize: number;
  medianPRSize: number;
  avgReviewComments: number;
  avgFilesChanged: number;
  uniqueContributors: number;
}

export interface ChangeMetrics {
  throughputMultiplier: number;
  mergeTimeChangeHours: number;
  mergeTimeChangePct: number;
  prSizeChangePct: number;
  reviewDepthChangePct: number;
}

export interface PeriodReport {
  window: PeriodWindow;
  metrics: PeriodMetrics;
}

export interface ReportData {
  repo: string;
  generatedAt: string;
  period: PeriodWindow;
  baseline: PeriodReport;
  comparison: PeriodReport;
  change: ChangeMetrics;
  prs: RawPR[];
}

export interface ContributorStats {
  author: string;
  prs: number;
  avgMergeTimeHours: number;
  avgSize: number;
}
