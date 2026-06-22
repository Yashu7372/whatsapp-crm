import { http } from './httpClient';
import type { LeadSignal } from '../types/lead';

export const leadApi = {
  listLeads: () =>
    http.get<LeadSignal[]>('/leads'),
};
