import { request } from '@playwright/test';
import { saveTokens } from './src/auth/token-store';
import { env } from './src/config/environment';
import { ApiClient, type ApiResponse } from './src/http/api-client';
import { isRecord } from './src/validation/guards';

/**
 * Authenticates once per run. Specs reuse the cached tokens through fixtures.
 */
export default async function globalSetup(): Promise<void> {
  const dummyJsonAccessToken = await fetchDummyJsonToken();
  const bookerToken = await fetchBookerToken();
  saveTokens({
    dummyJsonAccessToken,
    bookerToken,
    fetchedAt: new Date().toISOString(),
  });
  console.log('Authenticated against DummyJSON and Restful Booker. Tokens cached for this run.');
}

async function fetchDummyJsonToken(): Promise<string> {
  const response = await postWithRetry(env.dummyJsonBaseUrl, '/auth/login', {
    username: env.dummyJsonUsername,
    password: env.dummyJsonPassword,
  });
  if (
    response.status !== 200 ||
    !isRecord(response.body) ||
    typeof response.body.accessToken !== 'string'
  ) {
    throw new Error(`DummyJSON login failed with HTTP ${response.status}.`);
  }
  if (response.body.accessToken.split('.').length !== 3) {
    throw new Error('DummyJSON accessToken was not a JWT.');
  }
  return response.body.accessToken;
}

async function fetchBookerToken(): Promise<string> {
  const response = await postWithRetry(env.bookerBaseUrl, '/auth', {
    username: env.bookerUsername,
    password: env.bookerPassword,
  });
  if (
    response.status !== 200 ||
    !isRecord(response.body) ||
    typeof response.body.token !== 'string'
  ) {
    throw new Error(`Restful Booker auth failed with HTTP ${response.status}.`);
  }
  return response.body.token;
}

async function postWithRetry(
  baseURL: string,
  path: string,
  data: Record<string, string>,
): Promise<ApiResponse> {
  const context = await request.newContext({
    baseURL,
    timeout: 25_000,
    extraHTTPHeaders: {
      Accept: 'application/json',
      'User-Agent': 'hassanmehmoodd-playwright-api-automation',
    },
  });
  const client = new ApiClient(context);
  try {
    let last: ApiResponse | undefined;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        last = await client.post(path, data);
        if (last.status < 500 && last.status !== 429) return last;
      } catch (error) {
        if (attempt === 3) throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 500 * attempt);
      });
    }
    if (!last) throw new Error(`No response from ${baseURL}${path}.`);
    return last;
  } finally {
    await context.dispose();
  }
}
