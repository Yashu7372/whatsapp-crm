export interface TrendSignal {
  id: string;
  tenantId: string;
  platformCode: string;
  keyword?: string;
  hashtag?: string;
  topic?: string;
  country?: string;
  finalScore: number;
  freshnessScore: number;
  growthScore: number;
  brandSafetyScore: number;
  detectedAt: string;
  expiresAt?: string;
}
