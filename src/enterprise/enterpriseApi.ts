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

export const enterpriseApi = {
  projects: () => http.get<Project[]>('/projects?status=ACTIVE'),
  commercialOverview: (projectId: string, includeAi = true) =>
    http.get<CommercialOverview>(`/projects/${projectId}/commercial/overview?includeAi=${includeAi}`),
  paymentApplications: (projectId: string) =>
    http.get<PaymentApplication[]>(`/payment-applications?projectId=${projectId}`),
  documents: () => http.get<DocumentRecord[]>('/documents'),
};
