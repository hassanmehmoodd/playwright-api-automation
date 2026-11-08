import type { ApiClient, ApiResponse } from '../http/api-client';

/**
 * DummyJSON client.
 * The authenticated fixture sends `Authorization: Bearer <accessToken>`.
 * Write endpoints echo a simulated result and do not persist it.
 */
export class DummyJsonService {
  constructor(private readonly client: ApiClient) {}

  login(username: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/login', { username, password });
  }

  currentUser(headers?: Record<string, string>): Promise<ApiResponse> {
    return this.client.get('/auth/me', headers ? { headers } : undefined);
  }

  listProducts(limit: number, skip = 0): Promise<ApiResponse> {
    return this.client.get('/products', { params: { limit, skip } });
  }

  getProduct(id: number): Promise<ApiResponse> {
    return this.client.get(`/products/${id}`);
  }

  addProduct(payload: Record<string, unknown>): Promise<ApiResponse> {
    return this.client.post('/products/add', payload);
  }

  replaceProduct(id: number, payload: Record<string, unknown>): Promise<ApiResponse> {
    return this.client.put(`/products/${id}`, payload);
  }

  patchProduct(id: number, payload: Record<string, unknown>): Promise<ApiResponse> {
    return this.client.patch(`/products/${id}`, payload);
  }

  deleteProduct(id: number): Promise<ApiResponse> {
    return this.client.delete(`/products/${id}`);
  }
}
