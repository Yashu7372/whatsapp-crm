const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });

  if (res.status === 401) {
    // Try to refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${getToken()}` };
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
      if (!retry.ok) throw new Error(`API error ${retry.status}: ${path}`);
      if (retry.status === 204) return undefined as T;
      return retry.json() as Promise<T>;
    }
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function blob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { headers });
  if (res.status === 401 && await tryRefresh()) {
    const retryToken = getToken();
    const retryHeaders: Record<string, string> = {};
    if (retryToken) retryHeaders.Authorization = `Bearer ${retryToken}`;
    res = await fetch(`${BASE_URL}${path}`, { headers: retryHeaders });
  }
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.blob();
}

export const http = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload,
  blob,
};

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tenantId');
  window.location.href = '/login';
}
