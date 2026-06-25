import { http } from './httpClient';

export interface ShotItem {
  id: number;
  duration: number;
  visual: string;
  audio: string;
}

export interface VideoScript {
  id: string;
  title: string;
  platformCode: string;
  contentType: string;
  style: string;
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

export const videoApi = {
  list: () =>
    http.get<VideoScript[]>('/video-scripts'),
  listTemplates: () =>
    http.get<VideoTemplateOption[]>('/video-scripts/templates'),
  generate: (input: GenerateVideoInput) =>
    http.post<VideoScript>('/video-scripts/generate', input),
  delete: (id: string) =>
    http.delete<void>(`/video-scripts/${id}`),
};
