export type Id = string;

export interface Workspace { id: Id; code: string; name: string; status: string }
export interface Project { id: Id; workspaceId: Id; code: string; name: string; status: string; currency: string; timeZone: string }
export interface Organization { id: Id; legalName: string; displayName: string; status: string }
export interface Participant { id: Id; projectId: Id; organizationId: Id; partyRole: string; status: string }
export interface Scope { id: Id; projectId: Id; parentScopeId?: Id | null; scopeType: string; code: string; name: string; status: string }
export interface Capability { id: Id; projectId: Id; scopeId: Id; capabilityCode: string; enabled: boolean; configurationJson: string }
export interface DemoAccount { key: string; id: Id; email: string; displayName: string }
export interface SessionUser { userId: Id; email: string; displayName: string }
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
export interface WorkflowAssignmentOption { responsibilityCode: string; accessLevel: string; partyRole: string }
export interface WorkflowConfigurationOptions { assignments: WorkflowAssignmentOption[]; enabledCapabilities: string[]; completionActions: string[] }

export interface DemoUsers {
  admin: DemoAccount;
  site: DemoAccount;
  qce: DemoAccount;
  qcdc: DemoAccount;
  inspector: DemoAccount;
  re: DemoAccount;
  viewer: DemoAccount;
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
  civilScope: Scope;
  capabilities: Capability[];
  users: DemoUsers;
  document: DocumentView;
  workflowDefinition: WorkflowDefinition;
  workflowSteps: WorkflowStepDefinition[];
  workflowInstance: WorkflowInstance;
}

export const LOCAL_DEMO_PASSWORD = 'Project123!';
export const DEMO_LOGIN_OPTIONS = [
  ['admin@local.demo', 'Project Admin'],
  ['site@local.demo', 'Site Team'],
  ['qce@local.demo', 'QCE'],
  ['qcdc@local.demo', 'QC/DC'],
  ['inspector@local.demo', 'Consultant Inspector'],
  ['re@local.demo', 'Consultant RE'],
  ['viewer@local.demo', 'Scoped Viewer'],
] as const;

let csrfCache: { headerName: string; token: string } | null = null;

async function ensureCsrf() {
  if (csrfCache) return csrfCache;
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new Error('Could not initialize CSRF protection');
  csrfCache = await response.json() as { headerName: string; token: string };
  return csrfCache;
}

async function parseResponse(response: Response) {
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
    throw new Error(response.status === 401 ? 'Authentication required' : detail);
  }
  return body;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = await ensureCsrf();
    headers.set(csrf.headerName, csrf.token);
  }
  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  return await parseResponse(response) as T;
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export const auth = {
  me: () => request<SessionUser>('/api/auth/me'),
  login: (email: string, password: string) => post<SessionUser>('/api/auth/login', { email, password }),
  logout: async () => {
    await request<void>('/api/auth/logout', { method: 'POST' });
    csrfCache = null;
  },
  demoAccounts: () => request<DemoAccount[]>('/api/local/demo-accounts'),
};

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

function byKey(accounts: DemoAccount[], key: string) {
  const account = accounts.find(item => item.key === key);
  if (!account) throw new Error(`Local demo account is missing: ${key}`);
  return account;
}

export async function createDemo(): Promise<DemoState> {
  const current = await auth.me();
  if (current.email !== 'admin@local.demo') {
    throw new Error('Sign in as Project Admin before creating a fresh demo.');
  }
  const accounts = await auth.demoAccounts();
  const users: DemoUsers = {
    admin: byKey(accounts, 'admin'),
    site: byKey(accounts, 'site'),
    qce: byKey(accounts, 'qce'),
    qcdc: byKey(accounts, 'qcdc'),
    inspector: byKey(accounts, 'inspector'),
    re: byKey(accounts, 're'),
    viewer: byKey(accounts, 'viewer'),
  };

  const stamp = Date.now().toString().slice(-8);
  const workspace = await post<Workspace>('/api/v1/workspaces', {
    code: `LOCAL-${stamp}`,
    name: 'Local Project Control Workspace',
  });
  await addWorkspaceMembership(users.admin.id, workspace.id, 'PROJECT_ADMIN');

  const project = await post<Project>('/api/v1/projects', {
    workspaceId: workspace.id,
    code: `PC-${stamp}`,
    name: 'Creek Tower Local Test',
    description: 'Authenticated multi-user Project Control test',
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
  const civilScope = await post<Scope>(`/api/v1/projects/${project.id}/scopes`, {
    parentScopeId: constructionScope.id,
    scopeType: 'DISCIPLINE', code: 'CIVIL', name: 'Civil', configurationJson: '{}',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/participants`, {
    projectParticipantId: contractorParticipant.id, responsibility: 'MEP installation and submission',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/participants`, {
    projectParticipantId: consultantParticipant.id, responsibility: 'MEP review and approval',
  });
  await post(`/api/v1/projects/${project.id}/scopes/${civilScope.id}/participants`, {
    projectParticipantId: contractorParticipant.id, responsibility: 'Civil delivery',
  });

  const documentCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/DOCUMENT_CONTROL`, {
    enabled: true, configurationJson: '{}',
  });
  const inspectionCapability = await put<Capability>(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/capabilities/INSPECTION`, {
    enabled: true, configurationJson: '{}',
  });

  for (const [user, org, participant, responsibility, level] of [
    [users.site, contractor, contractorParticipant, 'SITE_TEAM', 'CONTRIBUTE'],
    [users.qce, contractor, contractorParticipant, 'QCE', 'APPROVE'],
    [users.qcdc, contractor, contractorParticipant, 'QC_DC', 'CONTRIBUTE'],
    [users.inspector, consultant, consultantParticipant, 'CONSULTANT_INSPECTOR', 'APPROVE'],
    [users.re, consultant, consultantParticipant, 'CONSULTANT_RE', 'APPROVE'],
    [users.viewer, consultant, consultantParticipant, 'VIEWER', 'VIEW'],
  ] as const) {
    await addOrgMembership(user.id, org.id, responsibility);
    await addScopeAssignment(user.id, project.id, mepScope.id, participant.id, responsibility, level);
  }

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
  for (const [sequence, stepCode, stepName, completionActionCode, responsibility] of stepInputs) {
    workflowSteps.push(await post<WorkflowStepDefinition>(`/api/v1/workflow-definitions/${workflowDefinition.id}/steps`, {
      sequence, stepCode, name: stepName, completionActionCode,
      assignmentJson: JSON.stringify({ responsibility }), configurationJson: '{}',
    }));
  }
  workflowDefinition = await post<WorkflowDefinition>(`/api/v1/workflow-definitions/${workflowDefinition.id}/activate`, {});
  await put(`/api/v1/projects/${project.id}/scopes/${mepScope.id}/workflow-bindings/${workflowDefinition.id}`, {
    enabled: true, configurationJson: '{}',
  });

  await auth.login(users.site.email, LOCAL_DEMO_PASSWORD);
  const document = await post<DocumentView>(`/api/v1/projects/${project.id}/documents`, {
    primaryScopeId: mepScope.id,
    originatorOrganizationId: contractor.id,
    numberSeriesCode: 'PRIME_MEP_SD',
    documentType: 'SHOP_DRAWING',
    title: 'CHW Routing Shop Drawing',
    description: 'Authenticated foundation test document',
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
    constructionScope, mepScope, civilScope, capabilities: [documentCapability, inspectionCapability],
    users, document, workflowDefinition, workflowSteps, workflowInstance,
  };
}

export const api = {
  getAccess: (projectId: Id, scopeId?: Id | null) => request<AccessView>(`/api/v1/projects/${projectId}/access${scopeId ? `?scopeId=${scopeId}` : ''}`),
  getWorkflowOptions: (projectId: Id, scopeId: Id) => request<WorkflowConfigurationOptions>(`/api/v1/projects/${projectId}/access/workflow-options?scopeId=${scopeId}`),
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
      description: 'Submitted from authenticated local UI',
      classificationCode: 'PROJECT',
      metadataJson: JSON.stringify({ source: 'LOCAL_UI', discipline: 'MEP' }),
    });
    await uploadRevisionInternal(document.id, 'A', 'Initial submitted PDF', file, file.name);
    return document;
  },
  uploadRevision: (documentId: Id, revisionCode: string, notes: string, file: File) =>
    uploadRevisionInternal(documentId, revisionCode, notes, file, file.name),
  openPdf: async (revisionId: Id) => {
    const response = await fetch(`/api/v1/document-revisions/${revisionId}/content`, { credentials: 'include' });
    if (!response.ok) throw new Error(await response.text() || `Could not open PDF (${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  listDefinitions: (projectId: Id) => request<WorkflowDefinition[]>(`/api/v1/projects/${projectId}/workflow-definitions`),
  listDefinitionSteps: (definitionId: Id) => request<WorkflowStepDefinition[]>(`/api/v1/workflow-definitions/${definitionId}/steps`),
  createWorkflowFlow: async (projectId: Id, scopeId: Id, input: { code: string; name: string; purposeCode: string; capabilityCode: string; steps: Array<{ stepCode: string; name: string; action: string; actResponsibilities: string[]; viewResponsibilities: string[] }> }) => {
    let definition = await post<WorkflowDefinition>(`/api/v1/projects/${projectId}/workflow-definitions`, {
      code: input.code, version: 1, name: input.name,
      purposeCode: input.purposeCode, requiredCapabilityCode: input.capabilityCode,
    });
    const steps: WorkflowStepDefinition[] = [];
    for (let index = 0; index < input.steps.length; index++) {
      const step = input.steps[index];
      const assignment: Record<string, unknown> = {};
      if (step.actResponsibilities.length) assignment.act = { responsibilityCodes: step.actResponsibilities };
      if (step.viewResponsibilities.length) assignment.view = { responsibilityCodes: step.viewResponsibilities };
      steps.push(await post<WorkflowStepDefinition>(`/api/v1/workflow-definitions/${definition.id}/steps`, {
        sequence: index + 1, stepCode: step.stepCode, name: step.name,
        completionActionCode: step.action,
        assignmentJson: JSON.stringify(assignment),
        configurationJson: '{}',
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
  const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF';
  return new Blob([content], { type: 'application/pdf' });
}
