import { http } from './httpClient';
import type { AnalyticsSnapshot, LearningInsight } from '../types/analytics';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export interface IngestInput {
  tenantId: string;
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
  getSnapshots: (tenantId = DEMO_TENANT_ID) =>
    http.get<AnalyticsSnapshot[]>(`/analytics/snapshots?tenantId=${tenantId}`),
  ingest: (input: IngestInput) =>
    http.post<AnalyticsSnapshot>('/analytics/ingest', input),
  getInsights: (tenantId = DEMO_TENANT_ID) =>
    http.get<LearningInsight[]>(`/learning/insights?tenantId=${tenantId}`),
};
