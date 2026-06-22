import { http } from './httpClient';
import type { Campaign, CreateCampaignInput } from '../types/campaign';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const campaignApi = {
  list: (tenantId = DEMO_TENANT_ID) =>
    http.get<Campaign[]>(`/campaigns?tenantId=${tenantId}`),
  create: (input: CreateCampaignInput) =>
    http.post<Campaign>('/campaigns', input),
  updateStatus: (id: string, status: string) =>
    http.patch<Campaign>(`/campaigns/${id}/status`, { status }),
};
