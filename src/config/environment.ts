import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Public demo accounts published by Restful Booker and DummyJSON.
 * Override any value with an environment variable or a local `.env` file.
 */
const PUBLIC_DEFAULTS = {
  BOOKER_BASE_URL: 'https://restful-booker.herokuapp.com',
  BOOKER_USERNAME: 'admin',
  BOOKER_PASSWORD: 'password123',
  DUMMYJSON_BASE_URL: 'https://dummyjson.com',
  DUMMYJSON_USERNAME: 'emilys',
  DUMMYJSON_PASSWORD: 'emilyspass',
  JSONPLACEHOLDER_BASE_URL: 'https://jsonplaceholder.typicode.com',
} as const;

function read(name: keyof typeof PUBLIC_DEFAULTS): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return PUBLIC_DEFAULTS[name];
  return value.trim();
}

function httpsUrl(name: string, value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${name} must use https.`);
  }
  return value.replace(/\/+$/, '');
}

export const env = {
  bookerBaseUrl: httpsUrl('BOOKER_BASE_URL', read('BOOKER_BASE_URL')),
  bookerUsername: read('BOOKER_USERNAME'),
  bookerPassword: read('BOOKER_PASSWORD'),
  dummyJsonBaseUrl: httpsUrl('DUMMYJSON_BASE_URL', read('DUMMYJSON_BASE_URL')),
  dummyJsonUsername: read('DUMMYJSON_USERNAME'),
  dummyJsonPassword: read('DUMMYJSON_PASSWORD'),
  jsonPlaceholderBaseUrl: httpsUrl('JSONPLACEHOLDER_BASE_URL', read('JSONPLACEHOLDER_BASE_URL')),
};
