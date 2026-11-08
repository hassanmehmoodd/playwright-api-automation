import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiResponse {
  status: number;
  ok: boolean;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Thin wrapper around Playwright's APIRequestContext.
 * GET calls retry transient sandbox failures. Writes are never retried,
 * so a retry cannot create a second booking or product.
 */
export class ApiClient {
  constructor(private readonly context: APIRequestContext) {}

  get(path: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.send('get', path, options);
  }

  post(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse> {
    return this.send('post', path, { ...options, data });
  }

  put(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse> {
    return this.send('put', path, { ...options, data });
  }

  patch(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse> {
    return this.send('patch', path, { ...options, data });
  }

  delete(path: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.send('delete', path, options);
  }

  private async send(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse> {
    const attempts = method === 'get' ? 3 : 1;
    let response: APIResponse | undefined;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        response = await this.context[method](path, buildRequest(options));
        lastError = undefined;
        if (!TRANSIENT_STATUS.has(response.status()) || attempt === attempts) break;
      } catch (error) {
        lastError = error;
        response = undefined;
        if (attempt === attempts) break;
      }
      await delay(300 * attempt);
    }

    if (!response) {
      throw lastError instanceof Error
        ? lastError
        : new Error(`Request failed for ${method.toUpperCase()} ${path}`);
    }

    const headers = response.headers();
    const text = await response.text();
    const body = parseBody(text, headers['content-type']);

    if (process.env.API_DEBUG === 'true') {
      console.log(`${method.toUpperCase()} ${response.url()} -> ${response.status()}`);
    }

    return {
      status: response.status(),
      ok: response.ok(),
      url: response.url(),
      headers,
      body,
    };
  }
}

function buildRequest(options: RequestOptions): {
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  failOnStatusCode: false;
} {
  const headers = {
    ...(options.data !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  return {
    failOnStatusCode: false,
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.params ? { params: options.params } : {}),
  };
}

function parseBody(text: string, contentType: string | undefined): unknown {
  if (!text.trim()) return null;
  const looksJson =
    (contentType ?? '').includes('json') ||
    text.trim().startsWith('{') ||
    text.trim().startsWith('[');
  if (!looksJson) return text;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
