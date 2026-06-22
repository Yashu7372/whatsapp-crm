export interface TrendSource {
  id: string;
  name: string;
  sourceType: 'MANUAL' | 'API' | 'RSS' | 'CSV';
}

export interface TrendSignal {
  id: string;
  tenantId: string;
  sourceId: string | null;
  keyword: string | null;
  hashtag: string | null;
  topic: string | null;
  country: string | null;
  industry: string | null;
  platformCode: string | null;
  rawScore: number;
  finalScore: number;
  freshnessScore: number;
  growthScore: number;
  relevanceScore: number;
  engagementScore: number;
  brandSafetyScore: number;
  capturedAt: string;
}

export interface ImportTrendInput {
  keyword: string;
  hashtag: string;
  topic: string;
  country: string;
  industry: string;
  platformCode: string;
  rawScore: number;
}
