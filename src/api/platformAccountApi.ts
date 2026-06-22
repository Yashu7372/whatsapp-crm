import { http } from './httpClient';

export interface PlatformAccount {
  id: string;
  tenantId: string;
  platformCode: string;
  externalAccountId: string | null;
  accountName: string | null;
  accountHandle: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const platformAccountApi = {
  list: () =>
    http.get<PlatformAccount[]>('/platform-accounts'),
  connect: (platformCode: string) =>
    http.post<{ oauthUrl: string }>('/platform-accounts', { platformCode }),
  addMock: (platformCode: string, accountName: string, accountHandle: string) =>
    http.post<PlatformAccount>('/platform-accounts/callback', { platformCode, accountName, accountHandle }),
  disconnect: (id: string) =>
    http.delete<void>(`/platform-accounts/${id}`),
};
