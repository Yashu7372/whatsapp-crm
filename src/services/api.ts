const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as any },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// ─── Workspace ──────────────────────────────────
export const api = {
  getWorkspace: () => request('/workspace'),
  updateWorkspace: (data: any) => request('/workspace', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // ─── Dashboard ──────────────────────────────────
  getStats: () => request('/stats'),

  // ─── Conversations ──────────────────────────────
  getConversations: () => request('/conversations'),
  getMessages: (conversationId: string) => request(`/conversations/${conversationId}/messages`),
  updateConversationStatus: (id: string, status: string) =>
    request(`/conversations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  sendMessage: (conversationId: string, message: string) =>
    request(`/conversations/${conversationId}/send`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // ─── Contacts ───────────────────────────────────
  getContacts: () => request('/contacts'),

  // ─── Bookings ───────────────────────────────────
  getBookings: () => request('/bookings'),

  // ─── Tunnel (public webhook URL) ────────────────
  getTunnelStatus: () => request('/tunnel/status'),
  startTunnel: () => request('/tunnel/start', { method: 'POST' }),
  stopTunnel: () => request('/tunnel/stop', { method: 'POST' }),
};
