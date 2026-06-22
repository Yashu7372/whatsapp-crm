export interface PublishJob {
  id: string;
  tenantId: string;
  contentIdeaId: string;
  platformAccountId: string;
  platformCode: string;
  status: 'SCHEDULED' | 'RUNNING' | 'PUBLISHED' | 'FAILED';
  scheduledAt: string;
  contentSnapshot: string;
  createdAt: string;
  updatedAt: string;
}
