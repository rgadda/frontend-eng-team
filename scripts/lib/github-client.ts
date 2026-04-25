import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';
import type { RawPR } from './types.js';

export class InvalidRepoError extends Error {
  constructor(repo: string) {
    super(`Invalid repo format: "${repo}". Expected "owner/repo".`);
    this.name = 'InvalidRepoError';
  }
}

export class AuthError extends Error {
  constructor() {
    super(
      'GitHub authentication failed (401). Check that your token is valid and has the "repo" scope.',
    );
    this.name = 'AuthError';
  }
}

export class RepoNotFoundError extends Error {
  constructor(repo: string) {
    super(
      `Repository "${repo}" not found (404). It may be private and require a token with access, or it may not exist.`,
    );
    this.name = 'RepoNotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(public readonly resetEpochSeconds: number) {
    const reset = new Date(resetEpochSeconds * 1000).toISOString();
    super(
      `GitHub rate limit exceeded. Resets at ${reset}. Re-run after that time.`,
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`Network error contacting GitHub API: ${detail}`);
    this.name = 'NetworkError';
  }
}

export interface FetchOptions {
  repo: string;
  since: Date;
  until: Date;
  token: string;
}

type ListItem =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][number];

type DetailItem =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}']['response']['data'];

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

const parseRepo = (repo: string): { owner: string; name: string } => {
  if (!REPO_PATTERN.test(repo)) throw new InvalidRepoError(repo);
  const [owner, name] = repo.split('/');
  return { owner, name };
};

const isMergedInRange = (
  pr: ListItem,
  since: Date,
  until: Date,
): pr is ListItem & { merged_at: string } => {
  if (!pr.merged_at) return false;
  const t = new Date(pr.merged_at).getTime();
  return t >= since.getTime() && t < until.getTime();
};

const hoursBetween = (createdAt: string, mergedAt: string): number => {
  const ms = new Date(mergedAt).getTime() - new Date(createdAt).getTime();
  return Math.round((ms / 3_600_000) * 10) / 10;
};

const toRawPR = (
  list: ListItem & { merged_at: string },
  detail: DetailItem,
): RawPR => {
  const reviewers = new Set<string>();
  for (const r of list.requested_reviewers ?? []) {
    if (r && 'login' in r && r.login) reviewers.add(r.login);
  }
  const reviewComments = detail.review_comments ?? 0;
  const issueComments = detail.comments ?? 0;
  return {
    number: list.number,
    title: list.title,
    author: list.user?.login ?? 'unknown',
    createdAt: list.created_at,
    mergedAt: list.merged_at,
    timeToMergeHours: hoursBetween(list.created_at, list.merged_at),
    additions: detail.additions ?? 0,
    deletions: detail.deletions ?? 0,
    totalLinesChanged: (detail.additions ?? 0) + (detail.deletions ?? 0),
    changedFiles: detail.changed_files ?? 0,
    reviewComments,
    totalComments: reviewComments + issueComments,
    reviewers: [...reviewers].sort(),
    labels: (list.labels ?? [])
      .map((l) => (typeof l === 'string' ? l : l.name ?? ''))
      .filter((n) => n.length > 0),
  };
};

const mapOctokitError = (err: unknown, repo: string): Error => {
  if (err instanceof RequestError) {
    if (err.status === 401) return new AuthError();
    if (err.status === 404) return new RepoNotFoundError(repo);
    if (err.status === 403) {
      const remaining = err.response?.headers['x-ratelimit-remaining'];
      const reset = err.response?.headers['x-ratelimit-reset'];
      if (remaining === '0' && typeof reset === 'string') {
        return new RateLimitError(Number(reset));
      }
    }
    return new NetworkError(err);
  }
  return new NetworkError(err);
};

export const fetchMergedPRsInRange = async (
  opts: FetchOptions,
): Promise<RawPR[]> => {
  const { owner, name } = parseRepo(opts.repo);
  const octokit = new Octokit({
    auth: opts.token,
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  });
  const collected: Array<ListItem & { merged_at: string }> = [];

  try {
    const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
      owner,
      repo: name,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    for await (const page of iterator) {
      let pageHasOlderThanSince = false;
      for (const pr of page.data) {
        if (new Date(pr.updated_at).getTime() < opts.since.getTime()) {
          pageHasOlderThanSince = true;
          continue;
        }
        if (isMergedInRange(pr, opts.since, opts.until)) {
          collected.push(pr);
        }
      }
      if (pageHasOlderThanSince) break;
    }
  } catch (err) {
    throw mapOctokitError(err, opts.repo);
  }

  const result: RawPR[] = [];
  for (const list of collected) {
    try {
      const detail = await octokit.rest.pulls.get({
        owner,
        repo: name,
        pull_number: list.number,
      });
      result.push(toRawPR(list, detail.data));
    } catch (err) {
      throw mapOctokitError(err, opts.repo);
    }
  }

  result.sort(
    (a, b) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime(),
  );
  return result;
};
