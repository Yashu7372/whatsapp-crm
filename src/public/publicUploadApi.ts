// Deliberately independent of ../api/httpClient: that client attaches the tenant JWT and
// redirects to /login on 401. This page has no session at all — every call here is scoped by
// the link token or the session token issued after password verification, nothing else.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type LinkMetadata = { label: string; requiresPassword: boolean };

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export const publicUploadApi = {
  metadata: async (token: string): Promise<LinkMetadata> => {
    const res = await fetch(`${BASE_URL}/public/upload-links/${token}`);
    if (!res.ok) throw new Error(await parseErrorBody(res));
    return res.json();
  },

  startSession: async (token: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/public/upload-links/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password || undefined }),
    });
    if (!res.ok) throw new Error(await parseErrorBody(res));
    const body = await res.json();
    return body.sessionToken;
  },

  upload: async (token: string, sessionToken: string, file: File, uploaderName: string, uploaderEmail: string): Promise<void> => {
    const form = new FormData();
    form.append('file', file);
    if (uploaderName) form.append('uploaderName', uploaderName);
    if (uploaderEmail) form.append('uploaderEmail', uploaderEmail);
    const res = await fetch(`${BASE_URL}/public/upload-links/${token}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: form,
    });
    if (!res.ok) throw new Error(await parseErrorBody(res));
  },
};
