import { test, expect } from '../../fixtures/api.fixture';
import { readFirstAvailableBooking } from '../support/booker-flow';
import {
  asRecord,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('Restful Booker bookings', { tag: ['@booker'] }, () => {
  test('answers the health ping', { tag: ['@smoke', '@positive'] }, async ({ bookerAnonymous }) => {
    const response = await bookerAnonymous.ping();

    expectStatus(response, 201);
    expect(String(response.body).trim()).toBe('Created');
  });

  test('lists booking ids', { tag: ['@smoke', '@positive'] }, async ({ bookerAnonymous }) => {
    const response = await bookerAnonymous.listBookings();

    expectStatus(response, 200);
    expectJsonContentType(response);
    expectSchema(response, 'booker/booking-id-list.schema.json');
    const ids = response.body as Array<{ bookingid: number }>;
    expect(ids.length).toBeGreaterThan(0);
    expect(ids[0].bookingid).toEqual(expect.any(Number));
  });

  test(
    'reads one booking from the live id list',
    { tag: ['@positive'] },
    async ({ bookerAnonymous }) => {
      const response = await readFirstAvailableBooking(bookerAnonymous);

      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'booker/booking.schema.json');
      const booking = asRecord(response.body, 'booking');
      expect(booking.firstname).toEqual(expect.any(String));
      expect(booking.totalprice).toEqual(expect.any(Number));
      const dates = asRecord(booking.bookingdates, 'booking dates');
      expect(String(dates.checkin) < String(dates.checkout)).toBe(true);
    },
  );

  test(
    'returns 404 for an unknown booking id',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.getBooking(999_999_999);

      expectStatus(response, 404);
      expect(String(response.body).trim()).toBe('Not Found');
    },
  );

  test(
    'returns 500 for an incomplete booking payload',
    { tag: ['@negative'] },
    async ({ bookerAnonymous }) => {
      const response = await bookerAnonymous.createBooking({ firstname: 'Incomplete' });

      expectStatus(response, 500);
      expect(String(response.body)).toContain('Internal Server Error');
    },
  );
});
