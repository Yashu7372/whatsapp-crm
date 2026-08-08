import { http } from '../api/httpClient';

export type Project = { id:string; name:string; projectCode:string; description?:string; contractValue?:number; currency:string; retentionPercent:number; status:string; startDate?:string; endDate?:string };
export type ProjectParticipant = { id:string; organizationId:string; organizationName:string; organizationCode?:string; partyRole:string; engagedByParticipantId?:string; active:boolean };
export type CommercialOverview = { projectId:string; projectCode:string; projectName:string; currency:string; contractValue:number; submittedIpc:number; certifiedIpc:number; paidToDate:number; retentionHeld:number; remainingBudget:number; approvedWorkEvidence:number; approvedButUnclaimed:number; certifiedPercent:number; paidPercent:number; ipcCount:number; documentCount:number; overdueDocumentSla:number; dueNext7Days:number; forecast:{forecastFinalCost:number;certifiedUnpaidExposure:number;contractEndDate?:string;risk:'LOW'|'MEDIUM'|'HIGH'}; suggestions:string[]; aiNarrative?:string|null };
export type PaymentApplication = { id:string; projectId:string; applicationRef:string; claimedByOrgName:string; periodStart:string; periodEnd:string; grossClaimed:number; previouslyCertified:number; retentionPercent:number; retentionAmount:number; netCertified:number; currency:string; status:string; submittedAt?:string; certifiedByEmail?:string; certifiedAt?:string };
export type DocumentRecord = { id:string; title:string; docType:string; status:string; projectId?:string; originatorOrgId?:string; documentCode?:string; dueAt?:string; reviewOutcome?:string; currentVersion:number; currentRevisionCode?:string; securityClassification?:'PROJECT'|'ORGANIZATION'|'RESTRICTED'; discipline?:string; packageCode?:string; locationCode?:string; issuePurpose?:string; issuedAt?:string; updatedAt:string };
export type IssuedRevision = { documentId:string; documentCode?:string; title:string; docType:string; versionId:string; versionNum:number; revisionCode:string; purpose?:string; issuedAt?:string };
export type Transmittal = { id:string; transmittalNo:string; senderOrganizationId:string; senderOrganizationName:string; purpose:string; subject?:string; status:string; issuedAt?:string; createdAt:string; itemCount:number; recipientCount:number };
export type TransmittalDetail = { header:{id:string;projectId:string;transmittalNo:string;senderOrganizationId:string;senderOrganizationName:string;purpose:string;subject?:string;message?:string;status:string;createdAt:string;issuedAt?:string}; items:Array<{id:string;documentId:string;versionId:string;documentCode?:string;title:string;revisionCode:string;issuePurpose?:string;createdAt:string}>; recipients:Array<{id:string;organizationId:string;organizationName:string;createdAt:string;acknowledgedAt?:string;acknowledgedByEmail?:string}>; history:Array<{eventType:string;at:string;subject?:string;detail?:string}> };
export type Workflow = { id:string; name:string; docType:string; steps:string; active:boolean; createdAt:string; updatedAt:string };
export type WorkflowStepDefinition = { name:string; authority:'INTERNAL_REVIEW'|'TECHNICAL_REVIEW'|'CLIENT_APPROVAL'|'COMMERCIAL_CERTIFICATION'; assignmentType:'USER'|'ORGANIZATION'|'PARTY_ROLE'; reviewerEmail?:string; organizationId?:string; partyRole?:'CLIENT'|'CONSULTANT'|'CONTRACTOR'|'SUBCONTRACTOR'; required?:boolean; parallelGroup?:string; slaHours?:number };
export type ApprovalWorkItem = { stepId:string; approvalId:string; documentId:string; projectId?:string; documentCode?:string; title:string; stepIndex:number; stepName?:string; authorityType:string; assignmentType:string; required:boolean; parallelGroup?:string; dueAt?:string; escalatedAt?:string; slaStatus:'NO_SLA'|'ON_TRACK'|'DUE_SOON'|'OVERDUE'; hoursRemaining?:number };
export type CapabilityOverride = { id:string; partyRole:string; userRole:string; permissionCode:string; effect:'ALLOW'|'DENY'; dataScope?:'PROJECT'|'ORGANIZATION'|'ASSIGNED'; updatedAt:string };
export type PermissionAudit = { id:string; projectId?:string; documentId?:string; eventType:string; principalType?:string; principalValue?:string; permissionCode?:string; oldValue?:string; newValue?:string; createdAt:string; actorEmail?:string };
export type DocumentNotification = { id:string; eventType:string; title:string; body:string; projectId?:string; documentId?:string; transmittalId?:string; payload:string; readAt?:string; createdAt:string };
export type NotificationPreferences = { emailEnabled:boolean; whatsappEnabled:boolean; whatsappNumber?:string };
export type NotificationDeliveryAudit = { id:string; channel:'EMAIL'|'WHATSAPP'; destination:string; status:string; attempts:number; lastError?:string; sentAt?:string; createdAt:string; eventType:string; userEmail:string };
export type ControlsSummary = { projectId:string; projectCode:string; projectName:string; currency:string; projectContractValue:number; partyOriginalContracts:number; approvedContractChanges:number; currentBudget:number; committedCost:number; actualCost:number; estimateToComplete:number; forecastFinalCost:number; forecastVariance:number; visibilityScope:'PROJECT'|'ORGANIZATION'; latestForecast?:ForecastSnapshot|null };
export type ProjectContract = { id:string; participantId:string; organizationId:string; organizationName:string; partyRole:string; contractRef:string; commercialModel:string; originalValue:number; approvedVariations:number; currentValue:number; currency:string; startDate?:string; endDate?:string; status:string };
export type BudgetLine = { id:string; parentLineId?:string|null; costCode:string; name:string; originalBudget:number; approvedChanges:number; currentBudget:number; committedCost:number; actualCost:number; estimateToComplete:number; forecastFinalCost:number; sortOrder:number };
export type BudgetView = { header:{id:string;versionNo:number;label:string;status:string;effectiveDate?:string}; lines:BudgetLine[]; totals:{currentBudget:number;committedCost:number;actualCost:number;estimateToComplete:number} };
export type ForecastSnapshot = { id:string; sourceOrganizationId?:string; sourceOrganizationName?:string; snapshotDate:string; forecastFinalCost:number; estimateToComplete:number; physicalProgressPercent?:number; scheduleProgressPercent?:number; notes?:string };
export type ResourceCostSummary = { labourCost:number; equipmentCost:number; manualCost:number; totalActualCost:number; activeResources:number; pendingTimesheets:number; visibilityScope:'PROJECT'|'ORGANIZATION' };
export type ProjectResource = { id:string; organizationId:string; organizationName:string; resourceType:'PERSON'|'EQUIPMENT'|'MACHINE'|'VEHICLE'; resourceCode:string; displayName:string; userId?:string; active:boolean };
export type ActualCostEntry = { id:string; organizationId:string; organizationName:string; budgetLineId?:string; costCode?:string; resourceId?:string; resourceName?:string; sourceType:'TIMESHEET'|'EQUIPMENT_USAGE'|'MANUAL'; costDate:string; quantity:number; amount:number; currency:string; description?:string };
export type CommercialFactSummary = { activeCommitments:number; acceptedMaterialActual:number; pendingVariationExposure:number; approvedVariations:number; visibilityScope:'PROJECT'|'ORGANIZATION' };
export type Commitment = { id:string; organizationId:string; organizationName:string; budgetLineId?:string; costCode?:string; commitmentType:'PURCHASE_ORDER'|'SUBCONTRACT'|'OTHER'; referenceNo:string; description?:string; originalAmount:number; approvedChanges:number; currentAmount:number; currency:string; status:string; startDate?:string; endDate?:string };
export type MaterialReceipt = { id:string; organizationId:string; organizationName:string; commitmentId?:string; commitmentReference?:string; budgetLineId?:string; costCode?:string; receiptRef:string; materialCode?:string; description:string; receiptDate:string; quantity:number; unit?:string; unitCost:number; amount:number; currency:string; status:string; documentId?:string };
export type Variation = { id:string; organizationId?:string; organizationName?:string; budgetLineId?:string; costCode?:string; variationRef:string; title:string; sourceType?:string; requestedAmount:number; approvedAmount?:number; currency:string; status:string; sourceDocumentId?:string; submittedAt?:string; approvedAt?:string };

export const enterpriseApi = {
  projects:()=>http.get<Project[]>('/projects?status=ACTIVE'),
  participants:(projectId:string)=>http.get<ProjectParticipant[]>(`/projects/${projectId}/participants?activeOnly=true`),
  commercialOverview:(projectId:string,includeAi=true)=>http.get<CommercialOverview>(`/projects/${projectId}/commercial/overview?includeAi=${includeAi}`),
  paymentApplications:(projectId:string)=>http.get<PaymentApplication[]>(`/payment-applications?projectId=${projectId}`),
  documents:()=>http.get<DocumentRecord[]>('/documents'),
  setDocumentSecurity:(documentId:string,request:{classification:string;discipline?:string;packageCode?:string;locationCode?:string})=>http.patch<void>(`/documents/${documentId}/security`,request),
  grantDocument:(documentId:string,request:{userId?:string;organizationId?:string;roleCode?:string;permission:string;expiresAt?:string})=>http.post<void>(`/documents/${documentId}/grants`,request),
  issueCurrentRevision:(documentId:string,purpose:string)=>http.post<{documentId:string;versionId:string;revisionCode:string;purpose:string}>(`/documents/${documentId}/issue`,{purpose}),
  issuedRevisions:(projectId:string)=>http.get<IssuedRevision[]>(`/projects/${projectId}/issued-revisions`),
  transmittals:(projectId:string)=>http.get<Transmittal[]>(`/projects/${projectId}/transmittals`),
  transmittalDetail:(id:string)=>http.get<TransmittalDetail>(`/transmittals/${id}`),
  createTransmittal:(projectId:string,request:{transmittalNo:string;purpose:string;subject?:string;message?:string})=>http.post<{id:string}>(`/projects/${projectId}/transmittals`,request),
  addTransmittalItem:(transmittalId:string,documentId:string,versionId:string)=>http.post<void>(`/transmittals/${transmittalId}/items`,{documentId,versionId}),
  addTransmittalRecipient:(transmittalId:string,organizationId:string)=>http.post<void>(`/transmittals/${transmittalId}/recipients/${organizationId}`,{}),
  issueTransmittal:(transmittalId:string)=>http.post<void>(`/transmittals/${transmittalId}/issue`,{}),
  acknowledgeTransmittal:(transmittalId:string)=>http.post<void>(`/transmittals/${transmittalId}/acknowledge`,{}),
  workflows:()=>http.get<Workflow[]>('/document-workflows'),
  createWorkflow:(request:{name:string;docType:string;steps:string})=>http.post<Workflow>('/document-workflows',request),
  updateWorkflow:(id:string,request:{name?:string;steps?:string;active?:boolean})=>http.patch<Workflow>(`/document-workflows/${id}`,request),
  approvalWorklist:()=>http.get<ApprovalWorkItem[]>('/approval-worklist/mine'),
  decideApproval:(approvalId:string,request:{decision?:string;comments?:string;reviewOutcome?:string})=>http.post<void>(`/documents/approvals/${approvalId}/decide`,request),
  refreshApprovalEscalations:()=>http.post<{escalated:number}>('/approval-worklist/escalations/refresh',{}),
  capabilityOverrides:(projectId:string)=>http.get<CapabilityOverride[]>(`/projects/${projectId}/capabilities`),
  setCapabilityOverride:(projectId:string,request:{partyRole:string;userRole:string;permissionCode:string;effect:'ALLOW'|'DENY';dataScope?:'PROJECT'|'ORGANIZATION'|'ASSIGNED'})=>http.put<void>(`/projects/${projectId}/capabilities`,request),
  resetCapabilityOverride:(projectId:string,partyRole:string,userRole:string,permissionCode:string)=>http.delete<void>(`/projects/${projectId}/capabilities?partyRole=${encodeURIComponent(partyRole)}&userRole=${encodeURIComponent(userRole)}&permissionCode=${encodeURIComponent(permissionCode)}`),
  permissionAudit:(projectId:string)=>http.get<PermissionAudit[]>(`/projects/${projectId}/capabilities/audit`),
  notifications:()=>http.get<DocumentNotification[]>('/document-notifications'),
  notificationUnread:()=>http.get<number>('/document-notifications/unread-count'),
  markNotificationRead:(id:string)=>http.post<void>(`/document-notifications/${id}/read`,{}),
  markAllNotificationsRead:()=>http.post<void>('/document-notifications/read-all',{}),
  notificationPreferences:()=>http.get<NotificationPreferences>('/document-notifications/preferences'),
  updateNotificationPreferences:(request:NotificationPreferences)=>http.put<void>('/document-notifications/preferences',request),
  notificationDeliveryAudit:()=>http.get<NotificationDeliveryAudit[]>('/document-notifications/delivery-audit'),
  controlsSummary:(projectId:string)=>http.get<ControlsSummary>(`/projects/${projectId}/controls/summary`),
  projectContracts:(projectId:string)=>http.get<ProjectContract[]>(`/projects/${projectId}/controls/contracts`),
  currentBudget:(projectId:string)=>http.get<BudgetView|undefined>(`/projects/${projectId}/controls/budget`),
  forecasts:(projectId:string)=>http.get<ForecastSnapshot[]>(`/projects/${projectId}/controls/forecasts`),
  resourceCostSummary:(projectId:string)=>http.get<ResourceCostSummary>(`/projects/${projectId}/resource-costs/summary`),
  projectResources:(projectId:string)=>http.get<ProjectResource[]>(`/projects/${projectId}/resource-costs/resources`),
  actualCosts:(projectId:string)=>http.get<ActualCostEntry[]>(`/projects/${projectId}/resource-costs/actual-costs`),
  commercialFactSummary:(projectId:string)=>http.get<CommercialFactSummary>(`/projects/${projectId}/commercial-facts/summary`),
  commitments:(projectId:string)=>http.get<Commitment[]>(`/projects/${projectId}/commercial-facts/commitments`),
  materialReceipts:(projectId:string)=>http.get<MaterialReceipt[]>(`/projects/${projectId}/commercial-facts/materials`),
  variations:(projectId:string)=>http.get<Variation[]>(`/projects/${projectId}/commercial-facts/variations`),
};
