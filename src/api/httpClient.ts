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

export const http = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload,
};

export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Platform admins (JwtService.buildPlatformToken, claim scope=PLATFORM) aren't tenant-scoped, so
 * /me/nav returns no items for them and they never show up in any tenant's role_permissions matrix.
 * Decoding the claim client-side is the only way the UI can tell "this session is platform-scoped"
 * apart from "this tenant's nav is genuinely empty" — see EnterpriseLayout's admin nav gating.
 */
export function isPlatformAdmin(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const claims = JSON.parse(atob(base64)) as { scope?: string };
    return claims.scope === 'PLATFORM';
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tenantId');
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('nav_cache_v1:')) localStorage.removeItem(key);
  }
  window.location.href = '/login';
}
