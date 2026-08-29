import { request, type Capability, type DocumentView, type Id, type RevisionView, type Scope } from './api';

export interface DocumentNumberSeries {
  id: Id;
  projectId: Id;
  seriesCode: string;
  documentType: string;
  prefix: string;
  separator: string;
  nextNumber: number;
  padding: number;
}

export interface SubmitDocumentInput {
  projectId: Id;
  scopeId: Id;
  originatorOrganizationId: Id;
  numberSeriesCode: string;
  documentType: string;
  title: string;
  description?: string;
  classificationCode?: string;
  metadataJson?: string;
  file: File;
}

export const productApi = {
  listNumberSeries: (projectId: Id) =>
    request<DocumentNumberSeries[]>(`/api/v1/projects/${projectId}/document-number-series`),

  defineNumberSeries: (projectId: Id, input: {
    seriesCode: string;
    documentType: string;
    prefix: string;
    padding: number;
    separator: string;
  }) => request<DocumentNumberSeries>(`/api/v1/projects/${projectId}/document-number-series`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),

  createScope: (projectId: Id, input: {
    parentScopeId?: Id | null;
    scopeType: string;
    code: string;
    name: string;
    description?: string;
  }) => request<Scope>(`/api/v1/projects/${projectId}/scopes`, {
    method: 'POST',
    body: JSON.stringify({ ...input, configurationJson: '{}' }),
  }),

  setScopeCapability: (projectId: Id, scopeId: Id, capabilityCode: string, enabled: boolean) =>
    request<Capability>(`/api/v1/projects/${projectId}/scopes/${scopeId}/capabilities/${encodeURIComponent(capabilityCode)}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled, configurationJson: '{}' }),
    }),

  submitDocument: async (input: SubmitDocumentInput) => {
    const document = await request<DocumentView>(`/api/v1/projects/${input.projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        primaryScopeId: input.scopeId,
        originatorOrganizationId: input.originatorOrganizationId,
        numberSeriesCode: input.numberSeriesCode,
        documentType: input.documentType,
        title: input.title,
        description: input.description ?? null,
        classificationCode: input.classificationCode ?? 'PROJECT',
        metadataJson: input.metadataJson ?? '{}',
      }),
    });

    const form = new FormData();
    form.set('revisionCode', 'A');
    form.set('changeNotes', 'Initial issue');
    form.set('file', input.file, input.file.name);
    await request<RevisionView>(`/api/v1/documents/${document.id}/revisions/upload`, {
      method: 'POST',
      body: form,
    });
    return document;
  },
};
