export interface ContentIdea {
  id: string;
  tenantId: string;
  campaignId: string | null;
  platformCode: string;
  contentType: 'REEL' | 'POST' | 'STORY' | 'CAROUSEL' | 'ARTICLE' | 'TEXT';
  status: 'GENERATED' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
  topic: string;
  generatedAt: string;
  createdAt: string;
}

export interface ContentVariant {
  id: string;
  contentIdeaId: string;
  body: string;
  hashtags: string[];
  callToAction: string | null;
  version: number;
  createdAt: string;
}

export interface GenerateContentInput {
  tenantId: string;
  campaignId?: string;
  platformCode: string;
  contentType: string;
  topic: string;
}
