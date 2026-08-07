import { http } from './httpClient';

export interface TenantFeatures {
  tenantId: string;
  plan: string;
  subscriptionStatus: string;
  features: Record<string, boolean>;
}

export const featuresApi = {
  getMyFeatures: () => http.get<TenantFeatures>('/me/features'),

  toggleFeature: (featureCode: string, enabled: boolean) =>
    http.patch<void>(`/me/features/${featureCode}`, { enabled }),
};
