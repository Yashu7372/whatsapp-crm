const API_BASE = '/api/v1';
const ACCESS_TOKEN_KEY = 'whatsapp_bot_access_token';
const REFRESH_TOKEN_KEY = 'whatsapp_bot_refresh_token';

export type TrendSignal = {
  id: string;
  keyword?: string;
  hashtag?: string;
  topic?: string;
  platformCode?: string;
  finalScore?: number;
  rawScore?: number;
};

export type VideoScript = {
  id: string;
  title: string;
  platformCode: string;
  contentType: string;
  style: string;
  durationSecs: number;
  hook?: string;
  scriptBody?: string;
  shotList: Array<Record<string, unknown>>;
  hashtags: string[];
  caption?: string;
  musicSuggestion?: string;
  status: string;
};

export type VideoTemplate = {
  code: string;
  name: string;
  description: string;
  definition: Record<string, unknown>;
  systemTemplate: boolean;
};

export type StockVideo = {
  provider: string;
  providerId: string;
  sourcePageUrl: string;
  downloadUrl: string;
  previewUrl: string;
  durationSeconds: number;
  creatorName: string;
  creatorUrl: string;
  width: number;
  height: number;
};

export type RenderJob = {
  id: string;
  scriptId: string;
  templateCode: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  outputReady: boolean;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
};

type TokenResponse = {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  error: string | null;
};

async function login(): Promise<string> {
  const email = import.meta.env.VITE_BACKEND_EMAIL || 'admin@demo.com';
  const password = import.meta.env.VITE_BACKEND_PASSWORD || 'admin123';
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json() as TokenResponse;
  if (!response.ok || !payload.accessToken) {
    throw new Error(payload.error || 'Could not authenticate with the Spring Boot backend');
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  if (payload.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  return payload.accessToken;
}

async function getToken(): Promise<string> {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || login();
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && !retried) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    await login();
    return request<T>(path, options, true);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail || payload.error || payload.message || 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const studioApi = {
  getTrendProviders: () => request<Array<{ code: string; name: string; available: boolean }>>('/trends/providers'),

  discoverTrends: (input: { industry: string; country: string; platformCode: string; count?: number }) =>
    request<TrendSignal[]>('/trends/discover', {
      method: 'POST',
      body: JSON.stringify({ ...input, count: input.count || 8 }),
    }),

  generateScript: (input: {
    topic: string;
    platformCode: string;
    style: string;
    durationSecs: number;
  }) => request<VideoScript>('/video-scripts/generate', {
    method: 'POST',
    body: JSON.stringify({ ...input, contentType: 'REEL' }),
  }),

  getTemplates: () => request<VideoTemplate[]>('/video-templates'),

  searchStock: (query: string) =>
    request<{ items: StockVideo[]; warnings: string[] }>(`/stock-media/search?query=${encodeURIComponent(query)}&perPage=12`),

  createRenderJob: (input: {
    scriptId: string;
    templateCode: string;
    assetUrls: string[];
    voice: string;
    brandName: string;
    callToAction: string;
  }) => request<RenderJob>('/render-jobs', {
    method: 'POST',
    body: JSON.stringify({ ...input, assetIds: [] }),
  }),

  getRenderJobs: () => request<RenderJob[]>('/render-jobs'),

  retryRenderJob: (id: string) => request<RenderJob>(`/render-jobs/${id}/retry`, { method: 'POST' }),

  async downloadRenderJob(id: string): Promise<void> {
    const token = await getToken();
    const response = await fetch(`${API_BASE}/render-jobs/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Could not download rendered reel');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reel-${id}.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
