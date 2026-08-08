import { http } from './httpClient';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export interface Document {
  id: string;
  title: string;
  docType: string;
  description: string;
  tags: string[];
  currentVersion: number;
  status: string;
  workflowId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPage {
  documents: Document[];
  page: number;
  size: number;
  hasMore: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNum: number;
  assetId: string | null;
  changeNotes: string;
  createdAt: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface DocumentApproval {
  id: string;
  documentId: string;
  status: string;
  currentStep: number;
  startedAt: string;
  completedAt: string | null;
}

export interface Workflow {
  id: string;
  name: string;
  docType: string;
  steps: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const documentApi = {
  list: (docType?: string) =>
    http.get<DocumentPage>(`/documents${docType ? `?docType=${docType}` : ''}`),

  get: (id: string) => http.get<Document>(`/documents/${id}`),

  create: (title: string, docType: string, description: string, file?: File) => {
    const token = localStorage.getItem('accessToken');
    const form = new FormData();
    form.append('title', title);
    if (docType) form.append('docType', docType);
    if (description) form.append('description', description);
    if (file) form.append('file', file);
    return http.upload<Document>('/documents', form);
  },

  createJson: (req: { title: string; docType?: string; description?: string }) =>
    http.post<Document>('/documents', req),

  patch: (id: string, req: { title?: string; description?: string; changeNotes?: string }) =>
    http.patch<Document>(`/documents/${id}`, req),

  delete: (id: string) => http.delete<void>(`/documents/${id}`),

  versions: (id: string) => http.get<DocumentVersion[]>(`/documents/${id}/versions`),

  comments: (id: string) => http.get<DocumentComment[]>(`/documents/${id}/comments`),

  addComment: (id: string, body: string) =>
    http.post<DocumentComment>(`/documents/${id}/comments`, { body }),

  submit: (id: string) => http.post<DocumentApproval>(`/documents/${id}/submit`, {}),

  approvals: (id: string) => http.get<DocumentApproval[]>(`/documents/${id}/approvals`),

  decide: (approvalId: string, decision: string, comments: string) =>
    http.post<void>(`/documents/approvals/${approvalId}/decide`, { decision, comments }),

  downloadUrl: (assetId: string) => `${BASE}/media/${assetId}/download`,
};

export const workflowApi = {
  list: () => http.get<Workflow[]>('/document-workflows'),

  create: (name: string, docType: string, steps: object[]) =>
    http.post<Workflow>('/document-workflows', { name, docType, steps: JSON.stringify(steps) }),

  update: (id: string, req: { name?: string; steps?: string; active?: boolean }) =>
    http.patch<Workflow>(`/document-workflows/${id}`, req),
};
