import { test, expect } from '../../fixtures/api.fixture';
import users from '../../test-data/dummyjson-users.json';
import { env } from '../../src/config/environment';
import {
  asRecord,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('DummyJSON bearer authentication', { tag: ['@dummyjson', '@auth'] }, () => {
  test(
    'reads the current user with the suite bearer token',
    { tag: ['@smoke', '@positive'] },
    async ({ dummyJson }) => {
      const response = await dummyJson.currentUser();

      expectStatus(response, 200);
      expectJsonContentType(response);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expectSchema(response, 'dummyjson/current-user.schema.json');

      const user = asRecord(response.body, 'current user');
      expect(user.username).toBe(env.dummyJsonUsername);
      expect(user.email).toEqual(expect.any(String));
      expect(user.id).toEqual(expect.any(Number));
    },
  );

  for (const user of users) {
    test(
      `logs in ${user.username} and returns a bearer token`,
      { tag: ['@data-driven', '@positive'] },
      async ({ dummyJsonAnonymous }) => {
        const response = await dummyJsonAnonymous.login(user.username, user.password);

        expectStatus(response, 200);
        expectJsonContentType(response);
        expectSchema(response, 'dummyjson/login.schema.json');
        const body = asRecord(response.body, 'login');
        expect(body.username).toBe(user.username);
        expect(body.id).toEqual(expect.any(Number));
      },
    );
  }

  test(
    'returns 401 when the bearer token is missing',
    { tag: ['@negative'] },
    async ({ dummyJsonAnonymous }) => {
      const response = await dummyJsonAnonymous.currentUser();

      expectStatus(response, 401);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/error.schema.json');
      expect(asRecord(response.body, 'error').message).toBe('Access Token is required');
    },
  );

  test(
    'returns 401 when the bearer token is malformed',
    { tag: ['@negative'] },
    async ({ dummyJsonAnonymous }) => {
      const response = await dummyJsonAnonymous.currentUser({
        Authorization: 'Bearer invalid-token',
      });

      expectStatus(response, 401);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/error.schema.json');
      expect(asRecord(response.body, 'error').message).toBe('Invalid/Expired Token!');
    },
  );

  test(
    'returns 400 when the password is wrong',
    { tag: ['@negative'] },
    async ({ dummyJsonAnonymous }) => {
      const response = await dummyJsonAnonymous.login(
        env.dummyJsonUsername,
        'not-the-demo-password',
      );

      expectStatus(response, 400);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/error.schema.json');
      expect(asRecord(response.body, 'error').message).toBe('Invalid credentials');
    },
  );
});
