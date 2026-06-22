import { http } from './httpClient';
import type { ContentIdea, ContentVariant, GenerateContentInput } from '../types/content';

export const contentApi = {
  listIdeas: (campaignId?: string) => {
    const params = campaignId ? `?campaignId=${campaignId}` : '';
    return http.get<ContentIdea[]>(`/content-ideas${params}`);
  },
  generate: (input: GenerateContentInput) =>
    http.post<ContentIdea>('/content-ideas/generate', input),
  updateStatus: (id: string, status: string) =>
    http.patch<ContentIdea>(`/content-ideas/${id}/status`, { status }),
  getVariants: (id: string) =>
    http.get<ContentVariant[]>(`/content-ideas/${id}/variants`),
};
