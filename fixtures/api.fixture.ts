import { request, test as base } from '@playwright/test';
import { loadTokens } from '../src/auth/token-store';
import { env } from '../src/config/environment';
import { ApiClient } from '../src/http/api-client';
import { BookerService } from '../src/services/booker.service';
import { DummyJsonService } from '../src/services/dummyjson.service';
import { JsonPlaceholderService } from '../src/services/jsonplaceholder.service';

interface ApiFixtures {
  booker: BookerService;
  bookerAnonymous: BookerService;
  dummyJson: DummyJsonService;
  dummyJsonAnonymous: DummyJsonService;
  jsonPlaceholder: JsonPlaceholderService;
}

const USER_AGENT = 'hassanmehmoodd-playwright-api-automation';

async function openClient(
  baseURL: string,
  headers?: Record<string, string>,
): Promise<{ client: ApiClient; dispose: () => Promise<void> }> {
  const context = await request.newContext({
    baseURL,
    timeout: 25_000,
    extraHTTPHeaders: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...headers,
    },
  });
  return {
    client: new ApiClient(context),
    dispose: () => context.dispose(),
  };
}

export const test = base.extend<ApiFixtures>({
  booker: async ({}, use) => {
    const tokens = loadTokens();
    const { client, dispose } = await openClient(env.bookerBaseUrl);
    await use(new BookerService(client, tokens.bookerToken));
    await dispose();
  },
  bookerAnonymous: async ({}, use) => {
    const { client, dispose } = await openClient(env.bookerBaseUrl);
    await use(new BookerService(client, null));
    await dispose();
  },
  dummyJson: async ({}, use) => {
    const tokens = loadTokens();
    const { client, dispose } = await openClient(env.dummyJsonBaseUrl, {
      Authorization: `Bearer ${tokens.dummyJsonAccessToken}`,
    });
    await use(new DummyJsonService(client));
    await dispose();
  },
  dummyJsonAnonymous: async ({}, use) => {
    const { client, dispose } = await openClient(env.dummyJsonBaseUrl);
    await use(new DummyJsonService(client));
    await dispose();
  },
  jsonPlaceholder: async ({}, use) => {
    const { client, dispose } = await openClient(env.jsonPlaceholderBaseUrl);
    await use(new JsonPlaceholderService(client));
    await dispose();
  },
});

export { expect } from '@playwright/test';
