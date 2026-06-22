import { http } from './httpClient';
import type { TrendSignal } from '../types/trend';

export const trendApi = {
  listTrends: (params?: { platformCode?: string; minScore?: number }) =>
    http.get<TrendSignal[]>(`/trends${params ? '?' + new URLSearchParams(params as any) : ''}`),
};
