import { http } from './httpClient';
import type { TrendSignal, ImportTrendInput } from '../types/trend';

export const trendApi = {
  listTrends: (params?: { platformCode?: string; minScore?: number }) => {
    const q = new URLSearchParams();
    if (params?.platformCode) q.set('platformCode', params.platformCode);
    if (params?.minScore !== undefined) q.set('minScore', String(params.minScore));
    const qs = q.toString();
    return http.get<TrendSignal[]>(`/trends${qs ? `?${qs}` : ''}`);
  },
  importSignal: (input: ImportTrendInput) =>
    http.post<TrendSignal>('/trends/import', input),
};
