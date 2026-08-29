import { http } from './httpClient';

export interface FeatureCatalogSummary {
  featureCode: string;
  module: string;
  navLabel: string;
}

export interface MatrixCell {
  role: string;
  featureCode: string;
  action: string;
  allowed: boolean;
}

export interface RolePermissionMatrix {
  roles: string[];
  actions: string[];
  features: FeatureCatalogSummary[];
  cells: MatrixCell[];
}

export const rolePermissionsApi = {
  getMatrix: () => http.get<RolePermissionMatrix>('/admin/role-permissions'),

  updateMatrix: (cells: MatrixCell[]) =>
    http.put<void>('/admin/role-permissions', { cells }),
};
