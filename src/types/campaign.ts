export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  goal: 'AWARENESS' | 'LEADS' | 'ENGAGEMENT' | 'TRAFFIC';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  platformCodes: string[];
  brief: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  tenantId: string;
  name: string;
  goal: string;
  brief: string;
}
