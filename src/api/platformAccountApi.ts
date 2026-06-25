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

  /** Returns the real OAuth URL to redirect the user to, or an error message if not configured. */
  getOAuthUrl: (platformCode: string) =>
    http.get<{ oauthUrl: string | null; error: string | null }>(
      `/oauth/${platformCode.toLowerCase()}/start`
    ),

  disconnect: (id: string) =>
    http.delete<void>(`/platform-accounts/${id}`),
};
