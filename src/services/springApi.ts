const SPRING_API_BASE = import.meta.env.VITE_SPRING_API_BASE || '/api/v1';
const LOCAL_EMAIL = import.meta.env.VITE_LOCAL_EMAIL || 'admin@demo.com';
const LOCAL_PASSWORD = import.meta.env.VITE_LOCAL_PASSWORD || 'admin123';

let accessToken = localStorage.getItem('spring_access_token') || '';
let refreshToken = localStorage.getItem('spring_refresh_token') || '';
let loginPromise: Promise<string> | null = null;

export type TrendSignal = {
  id: string;
  keyword?: string;
  hashtag?: string;
  topic?: string;
  country?: string;
  industry?: string;
  platformCode?: string;
  rawScore: number;
  finalScore: number;
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
  shotList?: string;
  hashtags?: string;
  caption?: string;
  musicSuggestion?: string;
  status: string;
  createdAt: string;
};

export type ReelTemplate = {
  code: string;
  name: string;
  description: string;
  bestFor: string;
};

export type ReelJob = {
  id: string;
  videoScriptId: string;
  title: string;
  templateCode: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  includeVoice: boolean;
  voice?: string;
  outputSizeBytes?: number;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  downloadUrl?: string;
};

export type MediaAsset = {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  assetType: string;
  refId?: string;
  createdAt: string;
};

export type StockMediaItem = {
  provider: string;
  providerId: string;
  mediaType: string;
  previewUrl?: string;
  downloadUrl: string;
  width: number;
  height: number;
  creator: string;
  sourceUrl?: string;
};

type RequestOptions = RequestInit & { skipAuth?: boolean; raw?: boolean };

async function login(): Promise<string> {
  if (accessToken) return accessToken;
  if (loginPromise) return loginPromise;

  loginPromise = fetch(`${SPRING_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOCAL_EMAIL, password: LOCAL_PASSWORD }),
  })
    .then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.accessToken) {
        throw new Error(body.error || `Local Spring login failed (${response.status})`);
      }
      accessToken = body.accessToken;
      refreshToken = body.refreshToken || '';
      localStorage.setItem('spring_access_token', accessToken);
      if (refreshToken) localStorage.setItem('spring_refresh_token', refreshToken);
      return accessToken;
    })
    .finally(() => {
      loginPromise = null;
    });

  return loginPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { skipAuth, raw, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const isForm = fetchOptions.body instanceof FormData;
  if (!isForm && fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    headers.set('Authorization', `Bearer ${await login()}`);
  }

  const response = await fetch(`${SPRING_API_BASE}${path}`, { ...fetchOptions, headers });
  if (response.status === 401 && !skipAuth && retry) {
    clearTokens();
    return request<T>(path, options, false);
  }
  if (!response.ok) {
    const errorBody = await response.json().catch(async () => ({ error: await response.text() }));
    throw new Error(errorBody.error || errorBody.message || errorBody.detail || `Request failed (${response.status})`);
  }
  if (raw) return response as unknown as T;
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function clearTokens() {
  accessToken = '';
  refreshToken = '';
  localStorage.removeItem('spring_access_token');
  localStorage.removeItem('spring_refresh_token');
}

export const springApi = {
  authenticate: () => login(),

  discoverTrends: (payload: { industry: string; country: string; platformCode: string; count: number }) =>
    request<TrendSignal[]>('/trends/discover', { method: 'POST', body: JSON.stringify(payload) }),

  recommendTrend: (id: string) => request<any>(`/trends/${id}/recommend`),

  listScripts: () => request<VideoScript[]>('/video-scripts'),

  generateScript: (payload: {
    topic: string;
    platformCode: string;
    contentType: string;
    style: string;
    durationSecs: number;
    contentIdeaId?: string;
  }) => request<VideoScript>('/video-scripts/generate', { method: 'POST', body: JSON.stringify(payload) }),

  listTemplates: () => request<ReelTemplate[]>('/reels/templates'),
  listReels: () => request<ReelJob[]>('/reels'),
  createReel: (payload: {
    videoScriptId: string;
    templateCode: string;
    includeVoice: boolean;
    voice: string;
    assetIds: string[];
    assetUrls: string[];
  }) => request<ReelJob>('/reels', { method: 'POST', body: JSON.stringify(payload) }),
  retryReel: (id: string) => request<ReelJob>(`/reels/${id}/retry`, { method: 'POST' }),

  listMedia: () => request<MediaAsset[]>('/media'),
  uploadMedia: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('assetType', 'REEL_SOURCE');
    return request<MediaAsset>('/media/upload', { method: 'POST', body: form });
  },

  searchStock: (query: string, provider = 'AUTO') =>
    request<{ items: StockMediaItem[]; pexelsConfigured: boolean; pixabayConfigured: boolean }>(
      `/stock-media/search?query=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}&limit=12`,
    ),

  downloadReel: async (id: string, title = 'reel') => {
    const response = await request<Response>(`/reels/${id}/download`, { raw: true });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'reel'}.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  clearTokens,
};
