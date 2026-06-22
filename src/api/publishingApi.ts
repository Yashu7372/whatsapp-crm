import { http } from './httpClient';
import type { PublishJob } from '../types/publishing';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export interface ScheduleJobInput {
  tenantId: string;
  contentIdeaId: string;
  platformAccountId: string;
  platformCode: string;
  scheduledAt: string;
  contentSnapshot: string;
}

export const publishingApi = {
  listJobs: (tenantId = DEMO_TENANT_ID) =>
    http.get<PublishJob[]>(`/publish-jobs?tenantId=${tenantId}`),
  scheduleJob: (input: ScheduleJobInput) =>
    http.post<PublishJob>('/publish-jobs', input),
};
