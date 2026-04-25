import type { ReportData } from '../types.js';

export const formatJson = (data: ReportData): string =>
  JSON.stringify(data, null, 2);
