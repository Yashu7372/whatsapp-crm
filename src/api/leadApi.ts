import { http } from './httpClient';
import type { LeadSignal } from '../types/lead';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const leadApi = {
  listLeads: (tenantId = DEMO_TENANT_ID) =>
    http.get<LeadSignal[]>(`/leads?tenantId=${tenantId}`),
};
