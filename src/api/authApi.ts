const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as LoginResponse;
  if (!res.ok || data.error) throw new Error(data.error ?? `Login failed (${res.status})`);
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('tenantId', data.tenantId);
  return data;
}
