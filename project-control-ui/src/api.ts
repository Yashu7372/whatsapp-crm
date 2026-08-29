export type Id = string;

export interface Workspace { id: Id; code: string; name: string; status: string }
export interface Project { id: Id; workspaceId: Id; code: string; name: string; status: string; currency: string; timeZone: string }
export interface Organization { id: Id; legalName: string; displayName: string; status: string }
export interface Participant { id: Id; projectId: Id; organizationId: Id; partyRole: string; status: string }
export interface Scope { id: Id; projectId: Id; parentScopeId?: Id | null; scopeType: string; code: string; name: string; status: string }
export interface Capability { id: Id; projectId: Id; scopeId: Id; capabilityCode: string; enabled: boolean; configurationJson: string }
export interface DocumentView { id: Id; projectId: Id; primaryScopeId?: Id | null; originatorOrganizationId?: Id | null; documentNumber: string; numberSource: string; numberSeriesCode?: string | null; documentType: string; title: string; description?: string | null; classificationCode?: string | null; metadataJson: string; status: string; currentRevisionSequence: number; currentRevisionCode?: string | null }
export interface RevisionView { id: Id; documentId: Id; sequenceNumber: number; revisionCode: string; revisionStatus: string; changeNotes?: string | null; contentUri?: string | null; contentSha256?: string | null; originalFilename?: string | null; mediaType?: string | null; sizeBytes?: number | null; createdAt: string }
export interface WorkflowDefinition { id: Id; projectId: Id; code: string; version: number; name: string; purposeCode: string; requiredCapabilityCode: string; status: string }
export interface WorkflowStepDefinition { id: Id; workflowDefinitionId: Id; sequence: number; stepCode: string; name: string; completionActionCode: string; assignmentJson: string; configurationJson: string }
export interface WorkflowStepVisit { id: Id; workflowInstanceId: Id; stepDefinitionId: Id; sequence: number; stepCode: string; stepName: string; visitNumber: number; assignmentJson: string; status: string; activatedAt: string; completedAt?: string | null }
export interface WorkflowInstance { id: Id; projectId: Id; scopeId: Id; workflowDefinitionId: Id; workflowCode: string; workflowVersion: number; purposeCode: string; requiredCapabilityCode: string; businessKey: string; title: string; status: string; currentStep?: WorkflowStepVisit | null; initiatedByReference?: string | null; initiatedAt: string; completedAt?: string | null; contextJson: string }
export interface WorkflowAction { id: Id; actionType: string; actionCode: string; actorReference?: string | null; fromStepCode?: string | null; toStepCode?: string | null; comment?: string | null; metadataJson: string; createdAt: string }
export interface WorkflowHistory { workflowInstanceId: Id; steps: WorkflowStepVisit[]; actions: WorkflowAction[] }

export interface DemoState {
  workspace: Workspace;
  project: Project;
  contractor: Organization;
  participant: Participant;
  constructionScope: Scope;
  mepScope: Scope;
  capabilities: Capability[];
  document: DocumentView;
  workflowDefinition: WorkflowDefinition;
  workflowSteps: WorkflowStepDefinition[];
  workflowInstance: WorkflowInstance;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown = undefined;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    const detail = typeof body === 'object' && body && 'detail' in body
      ? String((body as { detail?: unknown }).detail)
      : typeof body === 'object' && body && 'message' in body
        ? String((body as { message?: unknown }).message)
        : text || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }
  return body as T;
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function createDemo(): Promise<DemoState> {
  const stamp = Date.now().toString().slice(-8);
  const workspace = await post<Workspace>('/api/v1/workspaces', {
    code: `LOCAL-${stamp}`,
    name: 'Local Project Control Workspace',
  });
  const project = await post<Project>('/api/v1/projects', {
    workspaceId: workspace.id,
    code: `PC-${stamp}`,
    name: 'Creek Tower Local Test',
    description: 'Local end-to-end Project Control foundation test',
    currency: 'AED',
    timeZone: 'Asia/Dubai',
  });
  const contractor = await post<Organization>('/api/v1/organizations', {
    legalName: `Prime Mechanical ${stamp} LLC`,
    displayName: 'Prime Mechanical',
  });
  const participant = await post<Participant>(`/api/v1/projects/${project.id}/participants`, {
    organizationId: contractor.id,
    partyRole: 'SUBCONTRACTOR',
  });
  const constructionScope = await post<Scope>(`/api/v1/projects/${project.id}/scopes`, {
    scopeType: 'STAGE', code: 'CONSTRUCTION', name: 'Construction', configurationJson: '{}',
  });
  const mepScope = await post<Scope>(`/api/v1/projects/${project.id}/scopes`, {
    parentScopeId: constructionScope.id,
    scopeType: 'DISCIPLINE', code: 'MEP', name: 'MEP', configurationJson: '{}',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/participants`, {
    projectParticipantId: participant.id,
    responsibility: 'MEP installation and verification',
  });
  const documentCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/DOCUMENT_CONTROL`, {
    enabled: true, configurationJson: '{}',
  });
  const inspectionCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/INSPECTION`, {
    enabled: true, configurationJson: '{}',
  });

  await post(`/api/v1/projects/${project.id}/document-number-series`, {
    seriesCode: 'PRIME_MEP_SD', documentType: 'SHOP_DRAWING', prefix: 'LOCAL-MEP-SD', padding: 4, separator: '-',
  });
  const document = await post<DocumentView>(`/api/v1/projects/${project.id}/documents`, {
    primaryScopeId: mepScope.id,
    originatorOrganizationId: contractor.id,
    numberSeriesCode: 'PRIME_MEP_SD',
    documentType: 'SHOP_DRAWING',
    title: 'CHW Routing Shop Drawing',
    description: 'Foundation UI test document',
    classificationCode: 'PROJECT',
    metadataJson: JSON.stringify({ discipline: 'MEP', package: 'CHW', location: 'ZONE-B', issuePurpose: 'CONSTRUCTION' }),
  });
  await post<RevisionView>(`/api/v1/documents/${document.id}/revisions`, {
    revisionCode: 'A', changeNotes: 'Initial local UI test revision',
    contentUri: 'local://shop-drawing/rev-a', contentSha256: 'a'.repeat(64),
    originalFilename: 'chw-routing-a.pdf', mediaType: 'application/pdf', sizeBytes: 2048,
  });

  let workflowDefinition = await post<WorkflowDefinition>(`/api/v1/projects/${project.id}/workflow-definitions`, {
    code: 'ITR_APPROVAL', version: 1, name: 'Work Verification / ITR Approval',
    purposeCode: 'WORK_VERIFICATION', requiredCapabilityCode: 'INSPECTION',
  });
  const stepInputs = [
    [1, 'SITE_TEAM', 'Site Team Raise', 'SUBMIT', 'SITE_TEAM'],
    [2, 'QCE_VERIFY', 'QCE Verification', 'VERIFY', 'QCE'],
    [3, 'QC_DC_RECEIVE', 'QC/DC Receiving', 'RECEIVE', 'QC_DC'],
    [4, 'CONSULTANT_INSPECT', 'Consultant Inspector Review', 'REVIEW', 'CONSULTANT_INSPECTOR'],
    [5, 'RE_FINAL_APPROVAL', 'Consultant RE Final Approval', 'APPROVE', 'CONSULTANT_RE'],
  ] as const;
  const workflowSteps: WorkflowStepDefinition[] = [];
  for (const [sequence, stepCode, name, completionActionCode, assignment] of stepInputs) {
    workflowSteps.push(await post<WorkflowStepDefinition>(`/api/v1/workflow-definitions/${workflowDefinition.id}/steps`, {
      sequence, stepCode, name, completionActionCode,
      assignmentJson: JSON.stringify({ role: assignment }), configurationJson: '{}',
    }));
  }
  workflowDefinition = await post<WorkflowDefinition>(`/api/v1/workflow-definitions/${workflowDefinition.id}/activate`, {});
  await put(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/workflow-bindings/${workflowDefinition.id}`, {
    enabled: true, configurationJson: '{}',
  });
  const workflowInstance = await post<WorkflowInstance>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/workflow-instances`, {
    workflowDefinitionId: workflowDefinition.id,
    businessKey: `ITR-${stamp}`,
    title: 'CHW installation verification',
    initiatedByReference: 'site-team-local',
    contextJson: JSON.stringify({ location: 'Zone B', package: 'CHW' }),
  });

  return {
    workspace, project, contractor, participant, constructionScope, mepScope,
    capabilities: [documentCapability, inspectionCapability], document,
    workflowDefinition, workflowSteps, workflowInstance,
  };
}

export const api = {
  listDocuments: (projectId: Id) => request<DocumentView[]>(`/api/v1/projects/${projectId}/documents`),
  listRevisions: (documentId: Id) => request<RevisionView[]>(`/api/v1/documents/${documentId}/revisions`),
  addRevision: (documentId: Id, revisionCode: string, notes: string) => post<RevisionView>(`/api/v1/documents/${documentId}/revisions`, {
    revisionCode, changeNotes: notes, contentUri: `local://document/${revisionCode.toLowerCase()}`,
    contentSha256: 'c'.repeat(64), originalFilename: `revision-${revisionCode}.pdf`, mediaType: 'application/pdf', sizeBytes: 1024,
  }),
  getWorkflow: (id: Id) => request<WorkflowInstance>(`/api/v1/workflow-instances/${id}`),
  getHistory: (id: Id) => request<WorkflowHistory>(`/api/v1/workflow-instances/${id}/history`),
  workflowAction: (id: Id, body: { actionType: string; actionCode?: string; targetStepCode?: string; actorReference?: string; comment?: string }) =>
    post<WorkflowInstance>(`/api/v1/workflow-instances/${id}/actions`, { ...body, metadataJson: '{}' }),
};
