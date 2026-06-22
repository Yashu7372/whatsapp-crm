import { http } from './httpClient';
import type { ApprovalTask, ReviewInput } from '../types/approval';

export const approvalApi = {
  listAll: () =>
    http.get<ApprovalTask[]>('/approvals'),
  listPending: () =>
    http.get<ApprovalTask[]>('/approvals/pending'),
  create: (contentIdeaId: string) =>
    http.post<ApprovalTask>('/approvals', { contentIdeaId }),
  approve: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/approve`, input),
  reject: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/reject`, input),
  requestChanges: (id: string, input: ReviewInput) =>
    http.post<ApprovalTask>(`/approvals/${id}/request-changes`, input),
};
