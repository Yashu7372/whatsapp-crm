import { http } from './httpClient';

export interface Order {
  id: string;
  waMessageId: string | null;
  catalogId: string | null;
  orderPayload: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const orderApi = {
  list: () =>
    http.get<Order[]>('/orders'),
  updateStatus: (id: string, status: string) =>
    http.patch<Order>(`/orders/${id}/status`, { status }),
};
