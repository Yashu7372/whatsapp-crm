export type Id = string;

export interface Workspace { id: Id; code: string; name: string; status: string }
export interface Project { id: Id; workspaceId: Id; code: string; name: string; status: string; currency: string; timeZone: string }
export interface Organization { id: Id; legalName: string; displayName: string; status: string }
export interface Participant { id: Id; projectId: Id; organizationId: Id; partyRole: string; status: string }
export interface Scope { id: Id; projectId: Id; parentScopeId?: Id | null; scopeType: string; code: string; name: string; status: string }
export interface Capability { id: Id; projectId: Id; scopeId: Id; capabilityCode: string; enabled: boolean; configurationJson: string }
export interface UserView { id: Id; externalSubject: string; email?: string | null; displayName: string; status: string }
export interface DocumentView { id: Id; projectId: Id; primaryScopeId?: Id | null; originatorOrganizationId?: Id | null; documentNumber: string; numberSource: string; numberSeriesCode?: string | null; documentType: string; title: string; description?: string | null; classificationCode?: string | null; metadataJson: string; status: string; currentRevisionSequence: number; currentRevisionCode?: string | null }
export interface RevisionView { id: Id; documentId: Id; sequenceNumber: number; revisionCode: string; revisionStatus: string; changeNotes?: string | null; contentUri?: string | null; contentSha256?: string | null; originalFilename?: string | null; mediaType?: string | null; sizeBytes?: number | null; createdAt: string }
export interface WorkflowDefinition { id: Id; projectId: Id; code: string; version: number; name: string; purposeCode: string; requiredCapabilityCode: string; status: string }
export interface WorkflowStepDefinition { id: Id; workflowDefinitionId: Id; sequence: number; stepCode: string; name: string; completionActionCode: string; assignmentJson: string; configurationJson: string }
export interface WorkflowStepVisit { id: Id; workflowInstanceId: Id; stepDefinitionId: Id; sequence: number; stepCode: string; stepName: string; visitNumber: number; assignmentJson: string; status: string; activatedAt: string; completedAt?: string | null }
export interface WorkflowInstance { id: Id; projectId: Id; scopeId: Id; workflowDefinitionId: Id; workflowCode: string; workflowVersion: number; purposeCode: string; requiredCapabilityCode: string; businessKey: string; title: string; status: string; currentStep?: WorkflowStepVisit | null; initiatedByReference?: string | null; initiatedAt: string; completedAt?: string | null; contextJson: string }
export interface WorkflowAction { id: Id; actionType: string; actionCode: string; actorReference?: string | null; fromStepCode?: string | null; toStepCode?: string | null; comment?: string | null; metadataJson: string; createdAt: string }
export interface WorkflowHistory { workflowInstanceId: Id; steps: WorkflowStepVisit[]; actions: WorkflowAction[] }
export interface AccessDecision { outcome: 'ALLOW' | 'DENY'; reason: string }
export interface AccessView { userId: Id; displayName: string; projectId: Id; scopeId?: Id | null; workspaceRoles: string[]; scopeAssignments: Array<{ assignmentId: Id; scopeId: Id; projectParticipantId: Id; responsibilityCode: string; accessLevel: string }>; decisions: Record<string, AccessDecision> }

export interface DemoUsers {
  admin: UserView;
  submitter: UserView;
  reviewer: UserView;
  viewer: UserView;
}

export interface DemoState {
  workspace: Workspace;
  project: Project;
  contractor: Organization;
  consultant: Organization;
  contractorParticipant: Participant;
  consultantParticipant: Participant;
  constructionScope: Scope;
  mepScope: Scope;
  capabilities: Capability[];
  users: DemoUsers;
  document: DocumentView;
  workflowDefinition: WorkflowDefinition;
  workflowSteps: WorkflowStepDefinition[];
  workflowInstance: WorkflowInstance;
}

let activeUserId: Id | null = null;

export function setActiveUser(userId: Id | null) {
  activeUserId = userId;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (activeUserId) headers.set('X-Project-Control-User', activeUserId);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...init, headers });
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

async function createUser(subject: string, email: string, displayName: string) {
  return post<UserView>('/api/v1/users', { externalSubject: subject, email, displayName });
}

async function addOrgMembership(userId: Id, organizationId: Id, responsibilityCode: string) {
  return post(`/api/v1/users/${userId}/organization-memberships`, { organizationId, responsibilityCode });
}

async function addWorkspaceMembership(userId: Id, workspaceId: Id, accessRole: string) {
  return post(`/api/v1/users/${userId}/workspace-memberships`, { workspaceId, accessRole });
}

async function addScopeAssignment(userId: Id, projectId: Id, scopeId: Id, projectParticipantId: Id, responsibilityCode: string, accessLevel: string) {
  return post(`/api/v1/users/${userId}/scope-assignments`, { projectId, scopeId, projectParticipantId, responsibilityCode, accessLevel });
}

async function uploadRevisionInternal(documentId: Id, revisionCode: string, notes: string, file: Blob, filename: string) {
  const form = new FormData();
  form.set('revisionCode', revisionCode);
  form.set('changeNotes', notes);
  form.set('file', file, filename);
  return request<RevisionView>(`/api/v1/documents/${documentId}/revisions/upload`, { method: 'POST', body: form });
}

export async function createDemo(): Promise<DemoState> {
  const stamp = Date.now().toString().slice(-8);
  setActiveUser(null);
  const workspace = await post<Workspace>('/api/v1/workspaces', {
    code: `LOCAL-${stamp}`,
    name: 'Local Project Control Workspace',
  });
  const project = await post<Project>('/api/v1/projects', {
    workspaceId: workspace.id,
    code: `PC-${stamp}`,
    name: 'Creek Tower Local Test',
    description: 'Local multi-user Project Control test',
    currency: 'AED',
    timeZone: 'Asia/Dubai',
  });
  const contractor = await post<Organization>('/api/v1/organizations', {
    legalName: `Prime Mechanical ${stamp} LLC`, displayName: 'Prime Mechanical',
  });
  const consultant = await post<Organization>('/api/v1/organizations', {
    legalName: `Meridian Consultants ${stamp} LLC`, displayName: 'Meridian Consultants',
  });
  const contractorParticipant = await post<Participant>(`/api/v1/projects/${project.id}/participants`, {
    organizationId: contractor.id, partyRole: 'SUBCONTRACTOR',
  });
  const consultantParticipant = await post<Participant>(`/api/v1/projects/${project.id}/participants`, {
    organizationId: consultant.id, partyRole: 'CONSULTANT',
  });
  const constructionScope = await post<Scope>(`/api/v1/projects/${project.id}/scopes`, {
    scopeType: 'STAGE', code: 'CONSTRUCTION', name: 'Construction', configurationJson: '{}',
  });
  const mepScope = await post<Scope>(`/api/v1/projects/${project.id}/scopes`, {
    parentScopeId: constructionScope.id,
    scopeType: 'DISCIPLINE', code: 'MEP', name: 'MEP', configurationJson: '{}',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/participants`, {
    projectParticipantId: contractorParticipant.id, responsibility: 'MEP installation and submission',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/participants`, {
    projectParticipantId: consultantParticipant.id, responsibility: 'MEP review and approval',
  });
  const documentCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/DOCUMENT_CONTROL`, {
    enabled: true, configurationJson: '{}',
  });
  const inspectionCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/INSPECTION`, {
    enabled: true, configurationJson: '{}',
  });

  const admin = await createUser(`local:${stamp}:admin`, `admin-${stamp}@local.demo`, 'Project Admin');
  const submitter = await createUser(`local:${stamp}:submitter`, `submitter-${stamp}@local.demo`, 'Aisha Khan · Site Submitter');
  const reviewer = await createUser(`local:${stamp}:reviewer`, `reviewer-${stamp}@local.demo`, 'Omar Rahman · Consultant Reviewer');
  const viewer = await createUser(`local:${stamp}:viewer`, `viewer-${stamp}@local.demo`, 'Maya Joseph · Read-only Viewer');
  await addWorkspaceMembership(admin.id, workspace.id, 'PROJECT_ADMIN');
  await addOrgMembership(submitter.id, contractor.id, 'SITE_ENGINEER');
  await addScopeAssignment(submitter.id, project.id, mepScope.id, contractorParticipant.id, 'SITE_ENGINEER', 'CONTRIBUTE');
  await addOrgMembership(reviewer.id, consultant.id, 'CONSULTANT_RE');
  await addScopeAssignment(reviewer.id, project.id, mepScope.id, consultantParticipant.id, 'CONSULTANT_RE', 'APPROVE');
  await addWorkspaceMembership(viewer.id, workspace.id, 'PROJECT_VIEWER');

  setActiveUser(admin.id);
  await post(`/api/v1/projects/${project.id}/document-number-series`, {
    seriesCode: 'PRIME_MEP_SD', documentType: 'SHOP_DRAWING', prefix: 'LOCAL-MEP-SD', padding: 4, separator: '-',
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
      assignmentJson: JSON.stringify({ responsibility: assignment }), configurationJson: '{}',
    }));
  }
  workflowDefinition = await post<WorkflowDefinition>(`/api/v1/workflow-definitions/${workflowDefinition.id}/activate`, {});
  await put(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/workflow-bindings/${workflowDefinition.id}`, {
    enabled: true, configurationJson: '{}',
  });

  setActiveUser(submitter.id);
  const document = await post<DocumentView>(`/api/v1/projects/${project.id}/documents`, {
    primaryScopeId: mepScope.id,
    originatorOrganizationId: contractor.id,
    numberSeriesCode: 'PRIME_MEP_SD',
    documentType: 'SHOP_DRAWING',
    title: 'CHW Routing Shop Drawing',
    description: 'Foundation multi-user test document',
    classificationCode: 'PROJECT',
    metadataJson: JSON.stringify({ discipline: 'MEP', package: 'CHW', location: 'ZONE-B', issuePurpose: 'CONSTRUCTION' }),
  });
  await uploadRevisionInternal(document.id, 'A', 'Initial submitted PDF', demoPdfBlob(), 'chw-routing-a.pdf');
  const workflowInstance = await post<WorkflowInstance>(`/api/v1/documents/${document.id}/workflow-instances`, {
    workflowDefinitionId: workflowDefinition.id,
    businessKey: `ITR-${stamp}`,
    title: 'CHW installation verification',
    contextJson: JSON.stringify({ location: 'Zone B', package: 'CHW', documentId: document.id }),
  });

  return {
    workspace, project, contractor, consultant, contractorParticipant, consultantParticipant,
    constructionScope, mepScope, capabilities: [documentCapability, inspectionCapability],
    users: { admin, submitter, reviewer, viewer }, document,
    workflowDefinition, workflowSteps, workflowInstance,
  };
}

export const api = {
  getAccess: (projectId: Id, scopeId?: Id | null) => request<AccessView>(`/api/v1/projects/${projectId}/access${scopeId ? `?scopeId=${scopeId}` : ''}`),
  listDocuments: (projectId: Id) => request<DocumentView[]>(`/api/v1/projects/${projectId}/documents`),
  getDocument: (documentId: Id) => request<DocumentView>(`/api/v1/documents/${documentId}`),
  listRevisions: (documentId: Id) => request<RevisionView[]>(`/api/v1/documents/${documentId}/revisions`),
  submitDocument: async (projectId: Id, scopeId: Id, originatorOrganizationId: Id, title: string, file: File) => {
    const document = await post<DocumentView>(`/api/v1/projects/${projectId}/documents`, {
      primaryScopeId: scopeId,
      originatorOrganizationId,
      numberSeriesCode: 'PRIME_MEP_SD',
      documentType: 'SHOP_DRAWING',
      title,
      description: 'Submitted from local multi-user UI',
      classificationCode: 'PROJECT',
      metadataJson: JSON.stringify({ source: 'LOCAL_UI', discipline: 'MEP' }),
    });
    await uploadRevisionInternal(document.id, 'A', 'Initial submitted PDF', file, file.name);
    return document;
  },
  uploadRevision: (documentId: Id, revisionCode: string, notes: string, file: File) =>
    uploadRevisionInternal(documentId, revisionCode, notes, file, file.name),
  openPdf: async (revisionId: Id) => {
    const headers = new Headers();
    if (activeUserId) headers.set('X-Project-Control-User', activeUserId);
    const response = await fetch(`/api/v1/document-revisions/${revisionId}/content`, { headers });
    if (!response.ok) throw new Error(await response.text() || `Could not open PDF (${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  listDefinitions: (projectId: Id) => request<WorkflowDefinition[]>(`/api/v1/projects/${projectId}/workflow-definitions`),
  listDefinitionSteps: (definitionId: Id) => request<WorkflowStepDefinition[]>(`/api/v1/workflow-definitions/${definitionId}/steps`),
  createWorkflowFlow: async (projectId: Id, scopeId: Id, input: { code: string; name: string; purposeCode: string; capabilityCode: string; steps: Array<{ stepCode: string; name: string; action: string }> }) => {
    let definition = await post<WorkflowDefinition>(`/api/v1/projects/${projectId}/workflow-definitions`, {
      code: input.code, version: 1, name: input.name,
      purposeCode: input.purposeCode, requiredCapabilityCode: input.capabilityCode,
    });
    const steps: WorkflowStepDefinition[] = [];
    for (let index = 0; index < input.steps.length; index++) {
      const step = input.steps[index];
      steps.push(await post<WorkflowStepDefinition>(`/api/v1/workflow-definitions/${definition.id}/steps`, {
        sequence: index + 1, stepCode: step.stepCode, name: step.name,
        completionActionCode: step.action, assignmentJson: '{}', configurationJson: '{}',
      }));
    }
    definition = await post<WorkflowDefinition>(`/api/v1/workflow-definitions/${definition.id}/activate`, {});
    await put(`/api/v1/projects/${projectId}/scopes/${scopeId}/workflow-bindings/${definition.id}`, {
      enabled: true, configurationJson: '{}',
    });
    return { definition, steps };
  },
  startDocumentWorkflow: (documentId: Id, definitionId: Id, title: string) => post<WorkflowInstance>(`/api/v1/documents/${documentId}/workflow-instances`, {
    workflowDefinitionId: definitionId,
    businessKey: `WF-${Date.now().toString().slice(-8)}`,
    title,
    contextJson: JSON.stringify({ documentId }),
  }),
  listDocumentWorkflows: (documentId: Id) => request<WorkflowInstance[]>(`/api/v1/documents/${documentId}/workflow-instances`),
  getWorkflow: (id: Id) => request<WorkflowInstance>(`/api/v1/workflow-instances/${id}`),
  getHistory: (id: Id) => request<WorkflowHistory>(`/api/v1/workflow-instances/${id}/history`),
  workflowAction: (id: Id, body: { actionType: string; actionCode?: string; targetStepCode?: string; comment?: string }) =>
    post<WorkflowInstance>(`/api/v1/workflow-instances/${id}/actions`, { ...body, metadataJson: '{}' }),
};

function demoPdfBlob() {
  const base64 = 'JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA3IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9ZSAvUGFnZXMgNyAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwODI5MTUyNDMwKzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwODI5MTUyNDMwKzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyA0IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKOCAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAyNDIKPj4Kc3RyZWFtCkdhcnAkM3RIb3MnRiFGTj9aQU9tJkxmb2o7KzlOXDVkWkEoLjdIUGQyNVMrRyhUWydcUiUnVyxTRGgnZ0RLaj0lLiJPN3JHZlJUXm4uXV4oOVlqKTRILWJuImZcR21mYTg+NWk3SklyJUthVjRdKykvbG8wXERJQlJMMDInVV1HXU01KCRrcic1Ik1rNUFXNmFmT2ZXTUpTTENKMVFFOV8ramI2Ky1tS15CUD5ySkxYRkJoXEFiJmVlJm9pSU5mVixIWSFeakozQypYRSlGWGBTQVBLPVRGOSRpYThWP00qMiNbKDBRKFFJOGxjNixwNn4+ZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgOQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDEwMiAwMDAwMCBuIAowMDAwMDAwMjA5IDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKMDAwMDAwMDUyNCAwMDAwMCBuIAowMDAwMDAwNTkyIDAwMDAwIG4gCjAwMDAwMDA4NTMgMDAwMDAgbiAKMDAwMDAwMDkxMiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzw3Zjg5NzU2MDU0MDY5ZjBkYzNiNGQ5MTNlN2IyYzU4Yz48N2Y4OTc1NjA1NDA2OWYwZGMzYjRkOTEzZTdiMmM1OGM+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDYgMCBSCi9Sb290IDUgMCBSCi9TaXplIDkKPj4Kc3RhcnR4cmVmCjEyNDQKJSVFT0YK';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}
