import { http } from './httpClient';
import type { Platform, PlatformAccount } from '../types/platform';

export const platformApi = {
  listPlatforms: () => http.get<Platform[]>('/platforms'),
  listAccounts: () => http.get<PlatformAccount[]>('/platform-accounts'),
};
