import type { Booking } from '../domain/booking';
import type { ApiClient, ApiResponse } from '../http/api-client';

export interface TokenOverride {
  /** `null` sends the request with no token cookie. */
  token: string | null;
}

/**
 * Restful Booker client.
 * Updates and deletes send the suite token as `Cookie: token=...`.
 * The fixture always sends `Accept: application/json`, which this host requires on writes.
 */
export class BookerService {
  constructor(
    private readonly client: ApiClient,
    private readonly token: string | null = null,
  ) {}

  ping(): Promise<ApiResponse> {
    return this.client.get('/ping');
  }

  authenticate(username: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth', { username, password });
  }

  listBookings(filters?: { firstname?: string; lastname?: string }): Promise<ApiResponse> {
    const params: Record<string, string> = {};
    if (filters?.firstname) params.firstname = filters.firstname;
    if (filters?.lastname) params.lastname = filters.lastname;
    return this.client.get('/booking', Object.keys(params).length > 0 ? { params } : undefined);
  }

  getBooking(id: number): Promise<ApiResponse> {
    return this.client.get(`/booking/${id}`);
  }

  createBooking(payload: Booking | Record<string, unknown>): Promise<ApiResponse> {
    return this.client.post('/booking', payload);
  }

  updateBooking(id: number, payload: Booking, auth?: TokenOverride): Promise<ApiResponse> {
    return this.client.put(`/booking/${id}`, payload, { headers: this.cookieHeader(auth) });
  }

  patchBooking(id: number, payload: Partial<Booking>, auth?: TokenOverride): Promise<ApiResponse> {
    return this.client.patch(`/booking/${id}`, payload, { headers: this.cookieHeader(auth) });
  }

  deleteBooking(id: number, auth?: TokenOverride): Promise<ApiResponse> {
    return this.client.delete(`/booking/${id}`, { headers: this.cookieHeader(auth) });
  }

  private cookieHeader(auth?: TokenOverride): Record<string, string> | undefined {
    const token = auth ? auth.token : this.token;
    if (!token) return undefined;
    return { Cookie: `token=${token}` };
  }
}
