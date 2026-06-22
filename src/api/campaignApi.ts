import { http } from './httpClient';
import type { Campaign, CreateCampaignInput } from '../types/campaign';

export const campaignApi = {
  list: () =>
    http.get<Campaign[]>('/campaigns'),
  create: (input: CreateCampaignInput) =>
    http.post<Campaign>('/campaigns', input),
  updateStatus: (id: string, status: string) =>
    http.patch<Campaign>(`/campaigns/${id}/status`, { status }),
};
