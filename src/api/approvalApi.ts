import { http } from './httpClient';
import type { ApprovalTask, ReviewInput } from '../types/approval';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const approvalApi = {
  listAll: (tenantId = DEMO_TENANT_ID) =>
    http.get<ApprovalTask[]>(`/approvals?tenantId=${tenantId}`),
  listPending: (tenantId = DEMO_TENANT_ID) =>
    http.get<ApprovalTask[]>(`/approvals/pending?tenantId=${tenantId}`),
  create: (tenantId: string, contentIdeaId: string) =>
    http.post<ApprovalTask>('/approvals', { tenantId, contentIdeaId }),
  approve: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/approve`, input),
  reject: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/reject`, input),
  requestChanges: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/request-changes`, input),
};
