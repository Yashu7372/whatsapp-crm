import { http } from './httpClient';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  retailerId: string | null;
  imageUrl: string | null;
  inventoryCount: number | null;
  active: boolean;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price?: string;
  currency?: string;
  retailerId?: string;
  imageUrl?: string;
  inventoryCount?: number;
}

export const productApi = {
  list: (categoryId?: string) => {
    const q = categoryId ? `?categoryId=${categoryId}` : '';
    return http.get<Product[]>(`/products${q}`);
  },
  create: (input: CreateProductInput) =>
    http.post<Product>('/products', input),
  delete: (id: string) =>
    http.delete<void>(`/products/${id}`),
};
