import type { ApiClient, ApiResponse } from '../http/api-client';

export interface PostPayload {
  title: string;
  body: string;
  userId: number;
}

/**
 * JSONPlaceholder client.
 * Writes return a contract-compliant body and do not persist on the server.
 */
export class JsonPlaceholderService {
  constructor(private readonly client: ApiClient) {}

  getPost(id: number | string): Promise<ApiResponse> {
    return this.client.get(`/posts/${id}`);
  }

  getComments(postId: number): Promise<ApiResponse> {
    return this.client.get(`/posts/${postId}/comments`);
  }

  createPost(payload: PostPayload): Promise<ApiResponse> {
    return this.client.post('/posts', payload);
  }

  updatePost(id: number, payload: PostPayload & { id: number }): Promise<ApiResponse> {
    return this.client.put(`/posts/${id}`, payload);
  }

  patchPost(id: number, payload: Partial<PostPayload>): Promise<ApiResponse> {
    return this.client.patch(`/posts/${id}`, payload);
  }

  deletePost(id: number): Promise<ApiResponse> {
    return this.client.delete(`/posts/${id}`);
  }
}
