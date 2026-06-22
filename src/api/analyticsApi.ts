import { http } from './httpClient';
import type { AnalyticsSnapshot, LearningInsight } from '../types/analytics';

export interface IngestInput {
  publishJobId: string;
  platformCode: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  leads: number;
}

export const analyticsApi = {
  getSnapshots: () =>
    http.get<AnalyticsSnapshot[]>('/analytics/snapshots'),
  ingest: (input: IngestInput) =>
    http.post<AnalyticsSnapshot>('/analytics/ingest', input),
  getInsights: () =>
    http.get<LearningInsight[]>('/learning/insights'),
  generateInsights: () =>
    http.post<LearningInsight[]>('/learning/generate', {}),
};
