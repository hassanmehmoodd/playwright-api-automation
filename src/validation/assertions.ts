import { expect } from '@playwright/test';
import type { ApiResponse } from '../http/api-client';
import { schemaValidator } from './schema-validator';

const SENSITIVE_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'token',
  'password',
  'authorization',
]);

export function expectStatus(response: ApiResponse, status: number): void {
  expect(
    response.status,
    `${response.url} expected HTTP ${status} but received ${response.status}: ${summarizeBody(response.body)}`,
  ).toBe(status);
}

export function expectHeader(response: ApiResponse, name: string, expected: string | RegExp): void {
  const actual = response.headers[name.toLowerCase()];
  expect(
    actual,
    `Expected header ${name} on ${response.url}. Saw: ${Object.keys(response.headers).sort().join(', ')}`,
  ).toBeDefined();
  if (typeof expected === 'string') {
    expect(actual).toBe(expected);
  } else {
    expect(actual).toMatch(expected);
  }
}

export function expectJsonContentType(response: ApiResponse): void {
  expectHeader(response, 'content-type', /application\/json/i);
}

export function expectSchema(response: ApiResponse, schemaFile: string): void {
  const result = schemaValidator.validate(schemaFile, response.body);
  expect(
    result.valid,
    `${schemaFile} rejected the body from ${response.url}\n${result.errors}`,
  ).toBe(true);
}

export function asRecord(value: unknown, label: string): Record<string, unknown> {
  expect(value, `${label} should be a JSON object`).toBeTruthy();
  expect(typeof value, `${label} should be a JSON object`).toBe('object');
  expect(Array.isArray(value), `${label} should be a JSON object`).toBe(false);
  return value as Record<string, unknown>;
}

export function summarizeBody(body: unknown): string {
  const seen = new WeakSet<object>();
  let json: string;
  try {
    json = JSON.stringify(body, (key, value: unknown) => {
      if (SENSITIVE_KEYS.has(key)) return '[redacted]';
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
      }
      return value;
    });
  } catch {
    return '[unserializable body]';
  }
  if (json === undefined) return String(body);
  return json.length > 400 ? `${json.slice(0, 400)}…` : json;
}
