import { http } from '../api/httpClient';

export type ControlForecastSnapshot = {
  id: string;
  snapshotDate: string;
  currentBudget: number;
  actualCost: number;
  committedCost: number;
  estimateToComplete: number;
  pendingVariationExposure: number;
  baseEac: number;
  exposureEac: number;
  forecastVariance: number;
  physicalProgressPercent?: number;
  scheduleProgressPercent?: number;
  costConsumptionPercent: number;
};

export type EarlyWarning = {
  code: string;
  severity: 'INFO' | 'ATTENTION' | 'CRITICAL';
  title: string;
  metricValue?: number;
  thresholdValue?: number;
};

export type ConsultantKpi = {
  organizationId: string;
  organizationName: string;
  snapshotDate: string;
  documentSlaHealth: number;
  forecastAlignment: number;
  overallControlHealth: number;
  overdueDocuments: number;
  dueDocuments: number;
  latestPartyForecast?: number;
  controlForecast?: number;
  forecastGap?: number;
};

export type ForecastDashboard = {
  latest?: ControlForecastSnapshot | null;
  warnings: EarlyWarning[];
  consultantKpis: ConsultantKpi[];
  history: ControlForecastSnapshot[];
};

export const forecastApi = {
  dashboard: (projectId: string) =>
    http.get<ForecastDashboard>(`/projects/${projectId}/forecast-intelligence`),
  refresh: (projectId: string) =>
    http.post<ForecastDashboard>(`/projects/${projectId}/forecast-intelligence/refresh`, {}),
};
