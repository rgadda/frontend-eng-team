import type { RawPR } from '../types.js';

const HEADERS: readonly string[] = [
  'number',
  'title',
  'author',
  'createdAt',
  'mergedAt',
  'timeToMergeHours',
  'additions',
  'deletions',
  'totalLinesChanged',
  'changedFiles',
  'reviewComments',
  'totalComments',
  'reviewers',
  'labels',
];

const escapeCell = (value: string): string => {
  const needsQuoting = /[",\r\n]/.test(value);
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const cellFor = (pr: RawPR, header: string): string => {
  switch (header) {
    case 'number':
      return String(pr.number);
    case 'title':
      return pr.title;
    case 'author':
      return pr.author;
    case 'createdAt':
      return pr.createdAt;
    case 'mergedAt':
      return pr.mergedAt;
    case 'timeToMergeHours':
      return pr.timeToMergeHours.toString();
    case 'additions':
      return String(pr.additions);
    case 'deletions':
      return String(pr.deletions);
    case 'totalLinesChanged':
      return String(pr.totalLinesChanged);
    case 'changedFiles':
      return String(pr.changedFiles);
    case 'reviewComments':
      return String(pr.reviewComments);
    case 'totalComments':
      return String(pr.totalComments);
    case 'reviewers':
      return pr.reviewers.join(', ');
    case 'labels':
      return pr.labels.join(', ');
    default:
      return '';
  }
};

export const formatCsv = (prs: RawPR[]): string => {
  const lines: string[] = [HEADERS.join(',')];
  for (const pr of prs) {
    const row = HEADERS.map((h) => escapeCell(cellFor(pr, h)));
    lines.push(row.join(','));
  }
  return lines.join('\n');
};

export const CSV_HEADERS = HEADERS;
