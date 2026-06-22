import { http } from './httpClient';
import type { ContentIdea, ContentVariant, GenerateContentInput } from '../types/content';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const contentApi = {
  listIdeas: (tenantId = DEMO_TENANT_ID, campaignId?: string) => {
    const params = new URLSearchParams({ tenantId });
    if (campaignId) params.set('campaignId', campaignId);
    return http.get<ContentIdea[]>(`/content-ideas?${params}`);
  },
  generate: (input: GenerateContentInput) =>
    http.post<ContentIdea>('/content-ideas/generate', input),
  updateStatus: (id: string, status: string) =>
    http.patch<ContentIdea>(`/content-ideas/${id}/status`, { status }),
  getVariants: (id: string) =>
    http.get<ContentVariant[]>(`/content-ideas/${id}/variants`),
};
