export interface AnalyticsSnapshot {
  id: string;
  tenantId: string;
  publishJobId: string | null;
  platformCode: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  leads: number;
  capturedAt: string;
}

export interface LearningInsight {
  id: string;
  tenantId: string;
  insightType: string;
  title: string;
  summary: string;
  recommendation: string | null;
  confidenceScore: number;
  generatedAt: string;
}
