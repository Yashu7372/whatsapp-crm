import { http } from './httpClient';

export interface NavItem {
  featureCode: string;
  module: string;
  navSection: string | null;
  navLabel: string;
  navIcon: string | null;
  route: string | null;
  canManage: boolean;
}

export const navApi = {
  getMyNav: () => http.get<NavItem[]>('/me/nav'),
};
