import { http } from './httpClient';
import type { TrendSignal, ImportTrendInput } from '../types/trend';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const trendApi = {
  listTrends: (tenantId = DEMO_TENANT_ID, params?: { platformCode?: string; minScore?: number }) => {
    const q = new URLSearchParams({ tenantId });
    if (params?.platformCode) q.set('platformCode', params.platformCode);
    if (params?.minScore !== undefined) q.set('minScore', String(params.minScore));
    return http.get<TrendSignal[]>(`/trends?${q}`);
  },
  importSignal: (input: ImportTrendInput) =>
    http.post<TrendSignal>('/trends/import', input),
};
