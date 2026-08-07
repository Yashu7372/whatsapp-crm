import { http } from './httpClient';

export type TunnelStatus = 'idle' | 'starting' | 'active' | 'error';

export interface TunnelState {
  status: TunnelStatus;
  tunnelUrl: string | null;
  webhookUrl: string | null;
  error: string | null;
}

export const tunnelApi = {
  getStatus: () =>
    http.get<TunnelState>('/webhook/tunnel/status'),

  start: () =>
    http.post<TunnelState>('/webhook/tunnel/start', {}),

  stop: () =>
    http.post<TunnelState>('/webhook/tunnel/stop', {}),
};
