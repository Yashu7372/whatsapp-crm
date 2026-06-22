import { http } from './httpClient';
import type { PublishJob } from '../types/publishing';

export interface ScheduleJobInput {
  contentIdeaId: string;
  platformAccountId: string;
  platformCode: string;
  scheduledAt: string;
  contentSnapshot: string;
}

export const publishingApi = {
  listJobs: () =>
    http.get<PublishJob[]>('/publish-jobs'),
  scheduleJob: (input: ScheduleJobInput) =>
    http.post<PublishJob>('/publish-jobs', input),
};
