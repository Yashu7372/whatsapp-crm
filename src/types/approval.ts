export interface ApprovalTask {
  id: string;
  tenantId: string;
  contentIdeaId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
  reviewerNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ReviewInput {
  reviewedBy: string;
  note: string;
}
