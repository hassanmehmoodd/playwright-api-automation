import { test, expect } from '../../fixtures/api.fixture';
import { env } from '../../src/config/environment';
import type { Booking } from '../../src/domain/booking';
import {
  asRecord,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

const sampleBooking: Booking = {
  firstname: 'Auth',
  lastname: 'Probe',
  totalprice: 90,
  depositpaid: true,
  bookingdates: { checkin: '2026-11-01', checkout: '2026-11-03' },
  additionalneeds: 'None',
};

test.describe('Restful Booker authentication', { tag: ['@booker', '@auth'] }, () => {
  test(
    'issues a token for the public admin account',
    { tag: ['@smoke', '@positive'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.authenticate(env.bookerUsername, env.bookerPassword);

      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'booker/token.schema.json');
      const body = asRecord(response.body, 'token');
      expect(String(body.token).length).toBeGreaterThanOrEqual(8);
    },
  );

  // This sandbox answers bad credentials with HTTP 200 and a reason field.
  test(
    'returns the bad-credentials payload for a wrong password',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.authenticate(
        env.bookerUsername,
        'not-the-demo-password',
      );

      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'booker/auth-failure.schema.json');
      expect(asRecord(response.body, 'auth failure').reason).toBe('Bad credentials');
    },
  );

  test(
    'returns 403 when a booking update has no token cookie',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.updateBooking(1, sampleBooking);

      expectStatus(response, 403);
      expect(String(response.body).trim()).toBe('Forbidden');
    },
  );

  test(
    'returns 403 when a booking delete has no token cookie',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.deleteBooking(1);

      expectStatus(response, 403);
      expect(String(response.body).trim()).toBe('Forbidden');
    },
  );

  test(
    'returns 403 when a booking update uses a forged token',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.updateBooking(1, sampleBooking, {
        token: 'forged-token',
      });

      expectStatus(response, 403);
      expect(String(response.body).trim()).toBe('Forbidden');
    },
  );
});
