import { describe, expect, it } from 'vitest';
import { SAMPLE_PRS } from '../__fixtures__/sample-prs.js';
import { CSV_HEADERS, formatCsv } from './csv-formatter.js';

describe('formatCsv', () => {
  it('emits a header-only output when given no PRs', () => {
    const out = formatCsv([]);
    expect(out).toBe(CSV_HEADERS.join(','));
  });

  it('starts with the canonical header row', () => {
    const out = formatCsv(SAMPLE_PRS);
    const firstLine = out.split('\n')[0];
    expect(firstLine).toBe(CSV_HEADERS.join(','));
  });

  it('emits one data row per PR', () => {
    const out = formatCsv(SAMPLE_PRS);
    const lines = out.split('\n');
    expect(lines.length).toBe(SAMPLE_PRS.length + 1);
  });

  it('quotes and escapes titles that contain commas, quotes, or newlines', () => {
    const tricky = SAMPLE_PRS.find((p) => p.number === 10);
    expect(tricky).toBeDefined();
    const out = formatCsv([tricky!]);
    const dataRow = out.split('\n')[1];
    expect(dataRow).toContain('"Comparison: tricky title, has ""quotes"" and, commas"');
  });

  it('joins reviewers and labels with comma-space inside a quoted cell', () => {
    const multi = SAMPLE_PRS.find((p) => p.number === 4);
    expect(multi).toBeDefined();
    const out = formatCsv([multi!]);
    const dataRow = out.split('\n')[1];
    expect(dataRow).toContain('"alice, bob"');
  });

  it('renders empty reviewer and label lists as empty strings', () => {
    const empty = SAMPLE_PRS.find((p) => p.number === 1);
    expect(empty).toBeDefined();
    const out = formatCsv([empty!]);
    const dataRow = out.split('\n')[1];
    const cells = dataRow.split(',');
    expect(cells[cells.length - 1]).toBe('chore');
    expect(cells[cells.length - 2]).toBe('');
  });

  it('keeps ISO 8601 timestamps verbatim', () => {
    const pr = SAMPLE_PRS[0];
    const out = formatCsv([pr]);
    expect(out).toContain(pr.createdAt);
    expect(out).toContain(pr.mergedAt);
  });
});
