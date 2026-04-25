/**
 * collect-pr-metrics.ts — CLI to collect merged PR metrics from a GitHub repo.
 *
 * Usage:
 *   npx tsx scripts/collect-pr-metrics.ts --repo owner/repo [--days 28]
 *     [--baseline-days 14] [--output stdout|json|csv] [--token <pat>]
 *
 * Auth: pass --token or set GITHUB_TOKEN. The token must have the `repo` scope.
 * Create one at https://github.com/settings/tokens.
 */
import { Command, InvalidArgumentError } from 'commander';
import {
  AuthError,
  InvalidRepoError,
  NetworkError,
  RateLimitError,
  RepoNotFoundError,
  fetchMergedPRsInRange,
} from './lib/github-client.js';
import {
  computeChange,
  computePeriodMetrics,
  partitionPRs,
  topContributors,
} from './lib/metrics-calculator.js';
import { formatCsv } from './lib/formatters/csv-formatter.js';
import { formatJson } from './lib/formatters/json-formatter.js';
import { formatStdout } from './lib/formatters/stdout-formatter.js';
import type { CLIOptions, OutputFormat, ReportData } from './lib/types.js';

const VALID_OUTPUTS: readonly OutputFormat[] = ['stdout', 'json', 'csv'];

const parsePositiveInt = (raw: string, name: string): number => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== raw) {
    throw new InvalidArgumentError(`${name} must be a positive integer`);
  }
  return n;
};

const parseOutputFormat = (raw: string): OutputFormat => {
  if ((VALID_OUTPUTS as readonly string[]).includes(raw)) {
    return raw as OutputFormat;
  }
  throw new InvalidArgumentError(
    `--output must be one of: ${VALID_OUTPUTS.join(', ')}`,
  );
};

const buildProgram = (): Command => {
  const program = new Command();
  program
    .name('collect-pr-metrics')
    .description('Collect merged PR metrics from a GitHub repository')
    .requiredOption('--repo <owner/repo>', 'GitHub repo in owner/repo format')
    .option(
      '--days <n>',
      'Total days to look back',
      (raw) => parsePositiveInt(raw, '--days'),
      28,
    )
    .option(
      '--baseline-days <n>',
      'Days within --days to treat as the baseline period',
      (raw) => parsePositiveInt(raw, '--baseline-days'),
      14,
    )
    .option(
      '--output <format>',
      'Output format: stdout, json, or csv',
      (raw) => parseOutputFormat(raw),
      'stdout' as OutputFormat,
    )
    .option(
      '--token <token>',
      'GitHub PAT with repo scope (defaults to GITHUB_TOKEN env var)',
    );
  return program;
};

const TOKEN_SETUP_LINES: readonly string[] = [
  'Create a personal access token at https://github.com/settings/tokens',
  'with the "repo" scope, then either:',
  '  - export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx',
  '  - or pass --token ghp_xxxxxxxxxxxxxxxxxxxx',
];

const writeStderrLines = (header: string, lines: readonly string[]): void => {
  process.stderr.write(`${header}\n`);
  for (const line of lines) process.stderr.write(`${line}\n`);
};

const printMissingTokenInstructions = (): void => {
  writeStderrLines('No GitHub token provided.', TOKEN_SETUP_LINES);
};

const printAuthFailureInstructions = (): void => {
  writeStderrLines(
    'If your token is expired or missing the "repo" scope, regenerate it:',
    TOKEN_SETUP_LINES,
  );
};

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

const run = async (options: CLIOptions): Promise<number> => {
  const periodEnd = new Date();
  const periodStart = new Date(
    periodEnd.getTime() - options.days * 24 * 3_600_000,
  );
  const baselineEnd = new Date(
    periodStart.getTime() + options.baselineDays * 24 * 3_600_000,
  );

  const prs = await fetchMergedPRsInRange({
    repo: options.repo,
    since: periodStart,
    until: periodEnd,
    token: options.token,
  });

  if (prs.length === 0) {
    process.stderr.write(
      'No merged PRs found in range; emitting empty metrics.\n',
    );
  }

  const { baseline, comparison } = partitionPRs(
    prs,
    periodStart,
    baselineEnd,
    periodEnd,
  );
  const baselineMetrics = computePeriodMetrics(baseline, options.baselineDays);
  const comparisonMetrics = computePeriodMetrics(
    comparison,
    options.days - options.baselineDays,
  );
  const change = computeChange(baselineMetrics, comparisonMetrics);

  const report: ReportData = {
    repo: options.repo,
    generatedAt: periodEnd.toISOString(),
    period: {
      start: isoDate(periodStart),
      end: isoDate(periodEnd),
      days: options.days,
    },
    baseline: {
      window: {
        start: isoDate(periodStart),
        end: isoDate(baselineEnd),
        days: options.baselineDays,
      },
      metrics: baselineMetrics,
    },
    comparison: {
      window: {
        start: isoDate(baselineEnd),
        end: isoDate(periodEnd),
        days: options.days - options.baselineDays,
      },
      metrics: comparisonMetrics,
    },
    change,
    prs,
  };

  if (options.output === 'json') {
    process.stdout.write(`${formatJson(report)}\n`);
  } else if (options.output === 'csv') {
    process.stdout.write(`${formatCsv(prs)}\n`);
  } else {
    const contributors = topContributors(prs, 5);
    process.stdout.write(`${formatStdout(report, contributors)}\n`);
  }

  return 0;
};

const main = async (): Promise<void> => {
  const program = buildProgram();
  program.exitOverride();
  try {
    program.parse(process.argv);
  } catch {
    // Commander already wrote a usage/error message to stderr.
    process.exit(1);
  }

  const opts = program.opts<{
    repo: string;
    days: number;
    baselineDays: number;
    output: OutputFormat;
    token?: string;
  }>();

  if (opts.baselineDays >= opts.days) {
    process.stderr.write(
      `--baseline-days (${opts.baselineDays}) must be less than --days (${opts.days}).\n`,
    );
    process.exit(1);
  }

  const token = opts.token ?? process.env.GITHUB_TOKEN ?? '';
  if (!token) {
    printMissingTokenInstructions();
    process.exit(1);
  }

  const cliOptions: CLIOptions = {
    repo: opts.repo,
    days: opts.days,
    baselineDays: opts.baselineDays,
    output: opts.output,
    token,
  };

  try {
    const code = await run(cliOptions);
    process.exit(code);
  } catch (err) {
    if (
      err instanceof InvalidRepoError ||
      err instanceof AuthError ||
      err instanceof RepoNotFoundError ||
      err instanceof RateLimitError ||
      err instanceof NetworkError
    ) {
      process.stderr.write(`${err.message}\n`);
      if (err instanceof AuthError) printAuthFailureInstructions();
      process.exit(1);
    }
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Unexpected error: ${message}\n`);
    process.exit(1);
  }
};

void main();
