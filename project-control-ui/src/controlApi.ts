import { request, type Id } from './api';

export type Money = number;

export interface CostStructure { id: Id; projectId: Id; owningOrganizationId?: Id | null; contractId?: Id | null; code: string; name: string; structureType: string; status: string; version: number }
export interface CostNode { id: Id; structureId: Id; parentNodeId?: Id | null; code: string; name: string; category?: string | null; sortOrder: number; status: string }
export interface ScopeCostLink { id: Id; costNodeId: Id; scopeId: Id; allocationPercent?: number | null; relationshipType: string }
export interface BudgetVersion { id: Id; projectId: Id; owningOrganizationId?: Id | null; costStructureId: Id; versionNumber: number; status: string; baselineType: string; currency: string; createdBy?: Id | null; submittedBy?: Id | null; approvedBy?: Id | null; submittedAt?: string | null; approvedAt?: string | null; version: number }
export interface BudgetLine { id: Id; budgetVersionId: Id; costNodeId: Id; scopeId?: Id | null; amount: Money; notes?: string | null }
export interface Commitment { id: Id; projectId: Id; owningOrganizationId: Id; counterpartyOrganizationId?: Id | null; contractId?: Id | null; scopeId: Id; costNodeId: Id; reference: string; amount: Money; currency: string; status: string; committedAt: string; sourceDocumentRevisionId?: Id | null; version: number }
export interface ActualCost { id: Id; projectId: Id; owningOrganizationId: Id; scopeId: Id; costNodeId: Id; commitmentId?: Id | null; sourceType: string; sourceReference?: string | null; amount: Money; currency: string; accountingDate: string; status: string; sourceDocumentRevisionId?: Id | null }
export interface Forecast { id: Id; projectId: Id; owningOrganizationId: Id; scopeId: Id; costNodeId: Id; forecastPeriod: string; remainingForecastAmount: Money; currency: string; basis?: string | null; status: string; sourceDocumentRevisionId?: Id | null; version: number }
export interface CostSummary { costNodeId: Id; costStructureId: Id; owningOrganizationId?: Id | null; originalBudget: Money; currentBudget: Money; committed: Money; actual: Money; openCommitment: Money; remainingForecast: Money; eac: Money; vac: Money; budgetExposure: Money; availableBudget: Money }
export interface ScopeCostSummary { scopeId: Id; actual: Money; openCommitment: Money; remainingForecast: Money; eac: Money }
export interface BudgetDecision { id: Id; costNodeId: Id; currentBudget: Money; actual: Money; openCommitment: Money; remainingForecast: Money; proposedExposure: Money; availableBefore: Money; availableAfter: Money; decision: string; reason: string; mode: string }

export interface Contract { id: Id; projectId: Id; payerParticipantId: Id; payeeParticipantId: Id; payerOrganizationId: Id; payeeOrganizationId: Id; contractNumber: string; contractType: string; currency: string; originalValue: Money; visibilityPolicy: string; status: string; version: number }
export interface ContractItem { id: Id; contractId: Id; scopeId?: Id | null; itemCode: string; description: string; valuationMethod: string; unit?: string | null; plannedQuantity?: number | null; rate?: Money | null; contractValue: Money; dueDate?: string | null; status: string; version: number }
export interface Valuation { id: Id; projectId: Id; contractId: Id; scopeId?: Id | null; contractItemId: Id; valuationNumber: string; sourceType: string; sourceReference?: string | null; sourceDocumentRevisionId?: Id | null; measurementId?: Id | null; unit?: string | null; acceptedQuantity?: number | null; rate?: Money | null; grossValue: Money; priorValue: Money; currentValue: Money; cumulativeValue: Money; retention: Money; otherDeductions: Money; eligibleValue: Money; status: string; version: number }
export interface PaymentApplication { id: Id; projectId: Id; contractId: Id; applicationNumber: string; periodFrom?: string | null; periodTo?: string | null; dueDate?: string | null; claimedAmount: Money; certifiedAmount: Money; status: string; submittedBy?: Id | null; certifiedBy?: Id | null; submittedAt?: string | null; certifiedAt?: string | null; sourceDocumentRevisionId?: Id | null; version: number }
export interface PaymentApplicationLine { id: Id; paymentApplicationId: Id; valuationLineId: Id; claimedValue: Money; certifiedValue?: Money | null; certificationReason?: string | null }
export interface Payment { id: Id; projectId: Id; contractId: Id; paymentApplicationId: Id; paymentReference: string; amount: Money; currency: string; paidAt: string; payerOrganizationId: Id; payeeOrganizationId: Id; status: string; sourceDocumentRevisionId?: Id | null; version: number }
export interface ContractSummary { contractId: Id; originalValue: Money; approvedChanges: Money; currentValue: Money; valuedToDate: Money; claimedToDate: Money; certifiedToDate: Money; paidToDate: Money; retentionToDate: Money; outstandingCertified: Money }
export interface ControlledEvidence { revisionId: Id; documentId: Id; documentNumber: string; title: string; revisionCode: string; revisionStatus: string; contentSha256?: string | null; scopeId?: Id | null }
export interface PaymentTraceLine { applicationLineId: Id; claimedValue: Money; certifiedValue?: Money | null; certificationReason?: string | null; valuation: Valuation; contractItem: ContractItem; controlledEvidence?: ControlledEvidence | null; verificationPackageId?: Id | null; measurementId?: Id | null; verificationMappingStatus: string; verificationTrace?: VerificationTrace | null }
export interface PaymentTrace { payment: Payment; contract: Contract; paymentApplication: PaymentApplication; lines: PaymentTraceLine[] }

export interface VerificationPackage { id: Id; projectId: Id; scopeId: Id; packageNumber: string; subjectType: string; submittingOrganizationId: Id; createdByUserId: Id; submittedByUserId?: Id | null; status: string; submittedAt?: string | null; completedAt?: string | null; parentPackageId?: Id | null; version: number }
export interface VerificationItem { id: Id; packageId: Id; subjectResourceReference: string; claimedProgress?: number | null; claimedQuantity?: number | null; unit?: string | null; completionStatement?: string | null }
export interface VerificationEvidence { id: Id; packageId: Id; documentRevisionId: Id; evidenceType: string; visibilityScope: string; required: boolean; documentId: Id; documentNumber: string; title: string; revisionCode: string; revisionStatus: string; contentSha256: string; scopeId?: Id | null }
export interface VerificationDecision { id: Id; packageId: Id; itemId?: Id | null; actorUserId: Id; actorOrganizationId: Id; workflowInstanceId: Id; decision: string; acceptedQuantity?: number | null; rejectedQuantity?: number | null; unit?: string | null; comments?: string | null; decidedAt: string; priorDecisionId?: Id | null; subjectVersion: number }
export interface Measurement { id: Id; projectId: Id; scopeId: Id; subjectResourceReference: string; packageId: Id; itemId: Id; decisionId: Id; unit: string; periodFrom?: string | null; periodTo?: string | null; submittedQuantity?: number | null; measuredQuantity: number; acceptedQuantity: number; rejectedQuantity: number; status: string; verifiedByUserId: Id; verifiedAt: string; version: number }
export interface VerificationBundle { verificationPackage: VerificationPackage; items: VerificationItem[]; evidence: VerificationEvidence[]; decisions: VerificationDecision[]; measurements: Measurement[]; workflowInstanceId?: Id | null }
export interface VerificationTrace { measurement: Measurement; verificationPackage: VerificationPackage; items: VerificationItem[]; evidence: VerificationEvidence[]; decisions: VerificationDecision[]; workflowInstanceId?: Id | null }
export interface ScopeVerificationSummary { scopeId: Id; packageCount: number; submittedPackageCount: number; acceptedPackageCount: number; measurementCount: number; acceptedQuantity: number; rejectedQuantity: number }

export interface ScopeFinancialView { scopeId: Id; parentScopeId?: Id | null; scopeType: string; scopeCode: string; scopeName: string; directLedgerSummary: ScopeCostSummary; verificationSummary: ScopeVerificationSummary }
export interface CbsNodeFinancialView { node: CostNode; financialSummary: CostSummary; scopeLinks: ScopeCostLink[] }
export interface CbsStructureFinancialView { structure: CostStructure; nodes: CbsNodeFinancialView[] }
export interface ContractPerspectiveView { contract: Contract; organizationRelationship: string; commercialSummary: ContractSummary }
export interface FinancialDrilldown { projectId: Id; projectCode: string; projectName: string; currency: string; owningOrganizationId: Id; perspective: string; scopes: ScopeFinancialView[]; costStructures: CbsStructureFinancialView[]; contracts: ContractPerspectiveView[]; aggregationRule: string }
export interface CashFlowPeriod { month: string; postedInternalCost: Money; remainingCostForecast: Money; certifiedReceivable: Money; certifiedPayable: Money; actualCashIn: Money; actualCashOut: Money; netActualCash: Money; projectedFutureNetCash: Money }
export interface CashFlow { projectId: Id; organizationId: Id; currency: string; from: string; to: string; periods: CashFlowPeriod[]; accountingRule: string }

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const controlApi = {
  listCostStructures: (projectId: Id, owningOrganizationId?: Id | null) => request<CostStructure[]>(`/api/v1/projects/${projectId}/cost-structures${owningOrganizationId ? `?owningOrganizationId=${owningOrganizationId}` : ''}`),
  createCostStructure: (projectId: Id, body: { owningOrganizationId?: Id | null; contractId?: Id | null; code: string; name: string; structureType: string }) => post<CostStructure>(`/api/v1/projects/${projectId}/cost-structures`, body),
  listCostNodes: (projectId: Id, structureId: Id) => request<CostNode[]>(`/api/v1/projects/${projectId}/cost-structures/${structureId}/nodes`),
  createCostNode: (projectId: Id, structureId: Id, body: { parentNodeId?: Id | null; code: string; name: string; category?: string | null; sortOrder?: number | null }) => post<CostNode>(`/api/v1/projects/${projectId}/cost-structures/${structureId}/nodes`, body),
  listScopeLinks: (projectId: Id, nodeId: Id) => request<ScopeCostLink[]>(`/api/v1/projects/${projectId}/cost-nodes/${nodeId}/scope-links`),
  linkScope: (projectId: Id, nodeId: Id, body: { scopeId: Id; allocationPercent?: number | null; relationshipType: string }) => post<ScopeCostLink>(`/api/v1/projects/${projectId}/cost-nodes/${nodeId}/scope-links`, body),
  createBudget: (projectId: Id, body: { costStructureId: Id; baselineType: string; currency: string }) => post<BudgetVersion>(`/api/v1/projects/${projectId}/budgets/versions`, body),
  getBudget: (projectId: Id, budgetId: Id) => request<BudgetVersion>(`/api/v1/projects/${projectId}/budgets/${budgetId}`),
  listBudgetLines: (projectId: Id, budgetId: Id) => request<BudgetLine[]>(`/api/v1/projects/${projectId}/budgets/${budgetId}/lines`),
  addBudgetLine: (projectId: Id, budgetId: Id, body: { costNodeId: Id; scopeId?: Id | null; amount: number; notes?: string | null }) => post<BudgetLine>(`/api/v1/projects/${projectId}/budgets/${budgetId}/lines`, body),
  submitBudget: (projectId: Id, budgetId: Id, version: number) => post<BudgetVersion>(`/api/v1/projects/${projectId}/budgets/${budgetId}/submit`, { version }),
  approveBudget: (projectId: Id, budgetId: Id, version: number) => post<BudgetVersion>(`/api/v1/projects/${projectId}/budgets/${budgetId}/approve`, { version }),
  costSummary: (projectId: Id, nodeId: Id) => request<CostSummary>(`/api/v1/projects/${projectId}/cost-summary?costNodeId=${nodeId}`),
  scopeCostSummary: (projectId: Id, scopeId: Id, owningOrganizationId: Id) => request<ScopeCostSummary>(`/api/v1/projects/${projectId}/scopes/${scopeId}/cost-summary?owningOrganizationId=${owningOrganizationId}`),
  budgetCheck: (projectId: Id, body: { owningOrganizationId: Id; scopeId: Id; costNodeId: Id; proposedExposure: number; requestResourceReference?: string | null }) => post<BudgetDecision>(`/api/v1/projects/${projectId}/budget-control/check`, body),
  createCommitment: (projectId: Id, body: Record<string, unknown>) => post<Commitment>(`/api/v1/projects/${projectId}/commitments`, body),
  postActualCost: (projectId: Id, body: Record<string, unknown>) => post<ActualCost>(`/api/v1/projects/${projectId}/actual-costs`, body),
  setForecast: (projectId: Id, body: Record<string, unknown>) => post<Forecast>(`/api/v1/projects/${projectId}/forecasts`, body),

  listContracts: (projectId: Id) => request<Contract[]>(`/api/v1/projects/${projectId}/contracts`),
  createContract: (projectId: Id, body: Record<string, unknown>) => post<Contract>(`/api/v1/projects/${projectId}/contracts`, body),
  listContractItems: (projectId: Id, contractId: Id) => request<ContractItem[]>(`/api/v1/projects/${projectId}/contracts/${contractId}/items`),
  createContractItem: (projectId: Id, contractId: Id, body: Record<string, unknown>) => post<ContractItem>(`/api/v1/projects/${projectId}/contracts/${contractId}/items`, body),
  listValuations: (projectId: Id, contractId: Id) => request<Valuation[]>(`/api/v1/projects/${projectId}/valuations?contractId=${contractId}`),
  createValuation: (projectId: Id, body: Record<string, unknown>) => post<Valuation>(`/api/v1/projects/${projectId}/valuations`, body),
  createPaymentApplication: (projectId: Id, body: Record<string, unknown>) => post<PaymentApplication>(`/api/v1/projects/${projectId}/payment-applications`, body),
  getPaymentApplication: (projectId: Id, applicationId: Id) => request<PaymentApplication>(`/api/v1/projects/${projectId}/payment-applications/${applicationId}`),
  listPaymentApplicationLines: (projectId: Id, applicationId: Id) => request<PaymentApplicationLine[]>(`/api/v1/projects/${projectId}/payment-applications/${applicationId}/lines`),
  addPaymentApplicationLine: (projectId: Id, applicationId: Id, body: { valuationLineId: Id; claimedValue: number }) => post<PaymentApplicationLine>(`/api/v1/projects/${projectId}/payment-applications/${applicationId}/lines`, body),
  submitPaymentApplication: (projectId: Id, applicationId: Id, version: number) => post<PaymentApplication>(`/api/v1/projects/${projectId}/payment-applications/${applicationId}/submit`, { version }),
  certifyPaymentApplication: (projectId: Id, applicationId: Id, version: number, lines: Array<{ valuationLineId: Id; certifiedValue: number; reason?: string | null }>) => post<PaymentApplication>(`/api/v1/projects/${projectId}/payment-applications/${applicationId}/certify`, { version, lines }),
  listPayments: (projectId: Id, contractId: Id) => request<Payment[]>(`/api/v1/projects/${projectId}/payments?contractId=${contractId}`),
  recordPayment: (projectId: Id, body: Record<string, unknown>) => post<Payment>(`/api/v1/projects/${projectId}/payments`, body),
  contractSummary: (projectId: Id, contractId: Id) => request<ContractSummary>(`/api/v1/projects/${projectId}/contracts/${contractId}/commercial-summary`),
  paymentTrace: (projectId: Id, paymentId: Id) => request<PaymentTrace>(`/api/v1/projects/${projectId}/payments/${paymentId}/trace`),

  listVerificationPackages: (projectId: Id, scopeId?: Id | null) => request<VerificationPackage[]>(`/api/v1/projects/${projectId}/verification-packages${scopeId ? `?scopeId=${scopeId}` : ''}`),
  getVerificationPackage: (projectId: Id, packageId: Id) => request<VerificationBundle>(`/api/v1/projects/${projectId}/verification-packages/${packageId}`),
  createVerificationPackage: (projectId: Id, body: Record<string, unknown>) => post<VerificationPackage>(`/api/v1/projects/${projectId}/verification-packages`, body),
  addVerificationItem: (projectId: Id, packageId: Id, body: Record<string, unknown>) => post<VerificationItem>(`/api/v1/projects/${projectId}/verification-packages/${packageId}/items`, body),
  addVerificationEvidence: (projectId: Id, packageId: Id, body: Record<string, unknown>) => post<VerificationEvidence>(`/api/v1/projects/${projectId}/verification-packages/${packageId}/evidence`, body),
  submitVerificationPackage: (projectId: Id, packageId: Id, version: number, workflowDefinitionId: Id) => post<VerificationPackage>(`/api/v1/projects/${projectId}/verification-packages/${packageId}/submit`, { version, workflowDefinitionId }),
  decideVerification: (projectId: Id, packageId: Id, body: Record<string, unknown>) => post<VerificationDecision>(`/api/v1/projects/${projectId}/verification-packages/${packageId}/decisions`, body),
  createMeasurement: (projectId: Id, packageId: Id, body: Record<string, unknown>) => post<Measurement>(`/api/v1/projects/${projectId}/verification-packages/${packageId}/measurements`, body),
  listMeasurements: (projectId: Id, scopeId?: Id | null) => request<Measurement[]>(`/api/v1/projects/${projectId}/measurements${scopeId ? `?scopeId=${scopeId}` : ''}`),
  measurementTrace: (projectId: Id, measurementId: Id) => request<VerificationTrace>(`/api/v1/projects/${projectId}/measurements/${measurementId}/trace`),

  financialDrilldown: (projectId: Id, owningOrganizationId: Id) => request<FinancialDrilldown>(`/api/v1/projects/${projectId}/financial-drilldown?owningOrganizationId=${owningOrganizationId}`),
  cashFlow: (projectId: Id, organizationId: Id, from: string, to: string) => request<CashFlow>(`/api/v1/projects/${projectId}/cash-flow?organizationId=${organizationId}&from=${from}&to=${to}`),
};
