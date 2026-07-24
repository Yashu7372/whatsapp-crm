import { http } from './httpClient';

export interface ShotItem {
  id: number;
  duration: number;
  visual: string;
  audio: string;
  environment?: string;
  character?: string;
  action?: 'IDLE' | 'TALK' | 'WALK' | 'RUN' | 'WAVE' | 'POINT' | 'PRODUCT_TURN';
  expression?: string;
  camera?: 'CLOSE_UP' | 'MEDIUM' | 'WIDE' | 'TRACKING' | 'PRODUCT';
}

export interface VideoScript {
  id: string;
  title: string;
  platformCode: string;
  contentType: string;
  style: string;
  templateCode: string;
  durationSecs: number;
  hook: string | null;
  scriptBody: string | null;
  shotList: string; // JSON string of ShotItem[]
  hashtags: string; // JSON string of string[]
  caption: string | null;
  musicSuggestion: string | null;
  status: string;
  generatedAt: string;
  createdAt: string;
}

export interface VideoTemplateOption {
  code: string;
  displayName: string;
  shotCount: number;
}

export interface GenerateVideoInput {
  topic: string;
  platformCode: string;
  contentType: string;
  style: string;
  durationSecs: number;
  template?: string;
}

export interface VideoRenderJob {
  id: string;
  videoScriptId: string;
  templateCode: string;
  status: 'QUEUED' | 'RENDERING' | 'COMPLETED' | 'FAILED';
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export const videoApi = {
  list: () =>
    http.get<VideoScript[]>('/video-scripts'),
  listTemplates: () =>
    http.get<VideoTemplateOption[]>('/video-scripts/templates'),
  generate: (input: GenerateVideoInput) =>
    http.post<VideoScript>('/video-scripts/generate', input),
  delete: (id: string) =>
    http.delete<void>(`/video-scripts/${id}`),
  render: (scriptId: string, templateCode?: string) =>
    http.post<VideoRenderJob>(`/video-scripts/${scriptId}/render`, { templateCode }),
  listRenderJobs: (scriptId: string) =>
    http.get<VideoRenderJob[]>(`/video-scripts/${scriptId}/render-jobs`),
  getRenderJob: (jobId: string) =>
    http.get<VideoRenderJob>(`/video-render-jobs/${jobId}`),
  getRenderedVideo: (jobId: string) =>
    http.blob(`/video-render-jobs/${jobId}/video`),
};
