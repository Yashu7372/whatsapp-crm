import { http } from '../api/httpClient';

export type CommercialVisibility = 'PROJECT' | 'ORGANIZATION' | 'NONE';

export type ProjectDeliveryPortfolio = {
  accountName: string;
  activeProjects: number;
  totalContractValue: number;
  totalActualCost: number;
  openWorkItems: number;
  blockedWorkItems: number;
  overdueDocuments: number;
  commercialVisible: boolean;
  projects: ProjectDeliveryCard[];
};

export type ProjectDeliveryCard = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  currency: string;
  visibleContractValue: number;
  commercialVisibility: CommercialVisibility;
  startDate?: string;
  endDate?: string;
  progressPercent: number;
  actualCost: number;
  openWorkItems: number;
  blockedWorkItems: number;
  overdueDocuments: number;
  pendingApprovals: number;
  participantCount: number;
  stageCount: number;
  completedStages: number;
};

export type ProjectDeliveryDetail = {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  status: string;
  currency: string;
  contractValue: number;
  commercialVisibility: CommercialVisibility;
  startDate?: string;
  endDate?: string;
  kpis: DeliveryKpis;
  participants: ProjectParticipant[];
  stages: ProjectStage[];
};

export type DeliveryKpis = {
  progressPercent: number;
  actualCost: number;
  openWorkItems: number;
  blockedWorkItems: number;
  overdueDocuments: number;
  pendingApprovals: number;
  totalHours: number;
  stageCount: number;
  completedStages: number;
};

export type ProjectParticipant = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  partyRole: string;
  parentParticipantId?: string;
  staffCount: number;
};

export type ProjectStage = {
  id: string;
  stageCode: string;
  name: string;
  stageType: string;
  sequenceNo: number;
  status: string;
  progressPercent: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  budgetAmount: number;
  actualCost: number;
  openWorkItems: number;
  blockedWorkItems: number;
  workPackages: WorkPackage[];
};

export type WorkPackage = {
  id: string;
  packageCode: string;
  name: string;
  discipline?: string;
  status: string;
  progressPercent: number;
  budgetAmount: number;
  actualCost: number;
  totalHours: number;
  openWorkItems: number;
  blockedWorkItems: number;
  workItems: WorkItem[];
};

export type WorkItem = {
  id: string;
  itemCode: string;
  name: string;
  workType: string;
  status: string;
  priority: string;
  progressPercent: number;
  responsibleOrganizationId?: string;
  responsibleOrganizationName?: string;
  budgetLineId?: string;
  budgetAmount: number;
  actualCost: number;
  totalHours: number;
  documentCount: number;
  pendingDocumentCount: number;
  blockedReason?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  assignments: WorkAssignment[];
  documents: WorkDocument[];
  commercialVisible: boolean;
};

export type WorkAssignment = {
  userId: string;
  fullName: string;
  jobTitle?: string;
  department?: string;
  accessRole: string;
  organizationName: string;
  responsibility: string;
};

export type WorkDocument = {
  id: string;
  documentCode?: string;
  title: string;
  docType: string;
  status: string;
  revisionCode?: string;
  reviewOutcome?: string;
  dueAt?: string;
  approvedValue: number;
};

export const deliveryApi = {
  portfolio: () => http.get<ProjectDeliveryPortfolio>('/project-delivery/portfolio'),
  project: (projectId: string) => http.get<ProjectDeliveryDetail>(`/project-delivery/projects/${projectId}`),
};
