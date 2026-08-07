import { http } from '../api/httpClient';

export type Project = {
  id: string;
  name: string;
  projectCode: string;
  description?: string;
  contractValue?: number;
  currency: string;
  retentionPercent: number;
  status: string;
  startDate?: string;
  endDate?: string;
};

export type CommercialOverview = {
  projectId: string;
  projectCode: string;
  projectName: string;
  currency: string;
  contractValue: number;
  submittedIpc: number;
  certifiedIpc: number;
  paidToDate: number;
  retentionHeld: number;
  remainingBudget: number;
  approvedWorkEvidence: number;
  approvedButUnclaimed: number;
  certifiedPercent: number;
  paidPercent: number;
  ipcCount: number;
  documentCount: number;
  overdueDocumentSla: number;
  dueNext7Days: number;
  forecast: {
    forecastFinalCost: number;
    certifiedUnpaidExposure: number;
    contractEndDate?: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  suggestions: string[];
  aiNarrative?: string | null;
};

export type PaymentApplication = {
  id: string;
  projectId: string;
  applicationRef: string;
  claimedByOrgName: string;
  periodStart: string;
  periodEnd: string;
  grossClaimed: number;
  previouslyCertified: number;
  retentionPercent: number;
  retentionAmount: number;
  netCertified: number;
  currency: string;
  status: string;
  submittedAt?: string;
  certifiedByEmail?: string;
  certifiedAt?: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  docType: string;
  status: string;
  projectId?: string;
  documentCode?: string;
  dueAt?: string;
  approvedValue?: number;
  reviewOutcome?: string;
  currentVersion: number;
  updatedAt: string;
};

export type ControlsSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  currency: string;
  projectContractValue: number;
  partyOriginalContracts: number;
  approvedContractChanges: number;
  currentBudget: number;
  committedCost: number;
  actualCost: number;
  estimateToComplete: number;
  forecastFinalCost: number;
  forecastVariance: number;
  visibilityScope: 'PROJECT' | 'ORGANIZATION';
  latestForecast?: ForecastSnapshot | null;
};

export type ProjectContract = {
  id: string;
  participantId: string;
  organizationId: string;
  organizationName: string;
  partyRole: string;
  contractRef: string;
  commercialModel: string;
  originalValue: number;
  approvedVariations: number;
  currentValue: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  status: string;
};

export type BudgetLine = {
  id: string;
  parentLineId?: string | null;
  costCode: string;
  name: string;
  originalBudget: number;
  approvedChanges: number;
  currentBudget: number;
  committedCost: number;
  actualCost: number;
  estimateToComplete: number;
  forecastFinalCost: number;
  sortOrder: number;
};

export type BudgetView = {
  header: { id: string; versionNo: number; label: string; status: string; effectiveDate?: string };
  lines: BudgetLine[];
  totals: { currentBudget: number; committedCost: number; actualCost: number; estimateToComplete: number };
};

export type ForecastSnapshot = {
  id: string;
  sourceOrganizationId?: string;
  sourceOrganizationName?: string;
  snapshotDate: string;
  forecastFinalCost: number;
  estimateToComplete: number;
  physicalProgressPercent?: number;
  scheduleProgressPercent?: number;
  notes?: string;
};

export type ResourceCostSummary = {
  labourCost: number;
  equipmentCost: number;
  manualCost: number;
  totalActualCost: number;
  activeResources: number;
  pendingTimesheets: number;
  visibilityScope: 'PROJECT' | 'ORGANIZATION';
};

export type ProjectResource = {
  id: string;
  organizationId: string;
  organizationName: string;
  resourceType: 'PERSON' | 'EQUIPMENT' | 'MACHINE' | 'VEHICLE';
  resourceCode: string;
  displayName: string;
  userId?: string;
  active: boolean;
};

export type ActualCostEntry = {
  id: string;
  organizationId: string;
  organizationName: string;
  budgetLineId?: string;
  costCode?: string;
  resourceId?: string;
  resourceName?: string;
  sourceType: 'TIMESHEET' | 'EQUIPMENT_USAGE' | 'MANUAL';
  costDate: string;
  quantity: number;
  amount: number;
  currency: string;
  description?: string;
};

export const enterpriseApi = {
  projects: () => http.get<Project[]>('/projects?status=ACTIVE'),
  commercialOverview: (projectId: string, includeAi = true) =>
    http.get<CommercialOverview>(`/projects/${projectId}/commercial/overview?includeAi=${includeAi}`),
  paymentApplications: (projectId: string) =>
    http.get<PaymentApplication[]>(`/payment-applications?projectId=${projectId}`),
  documents: () => http.get<DocumentRecord[]>('/documents'),
  controlsSummary: (projectId: string) =>
    http.get<ControlsSummary>(`/projects/${projectId}/controls/summary`),
  projectContracts: (projectId: string) =>
    http.get<ProjectContract[]>(`/projects/${projectId}/controls/contracts`),
  currentBudget: (projectId: string) =>
    http.get<BudgetView | undefined>(`/projects/${projectId}/controls/budget`),
  forecasts: (projectId: string) =>
    http.get<ForecastSnapshot[]>(`/projects/${projectId}/controls/forecasts`),
  resourceCostSummary: (projectId: string) =>
    http.get<ResourceCostSummary>(`/projects/${projectId}/resource-costs/summary`),
  projectResources: (projectId: string) =>
    http.get<ProjectResource[]>(`/projects/${projectId}/resource-costs/resources`),
  actualCosts: (projectId: string) =>
    http.get<ActualCostEntry[]>(`/projects/${projectId}/resource-costs/actual-costs`),
};
