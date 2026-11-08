import { test, expect } from '../../fixtures/api.fixture';
import { withUniqueFirstname, type Booking } from '../../src/domain/booking';
import {
  asRecord,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';
import {
  deleteBookingQuietly,
  expectBooking,
  readBookingMatching,
  waitForBookingStatus,
} from '../support/booker-flow';

test.describe('booking lifecycle', { tag: ['@booker', '@chain', '@positive'] }, () => {
  test('persists a booking through create, read, update, patch, and delete', async ({ booker }) => {
    const createdPayload = withUniqueFirstname({
      firstname: 'Chain',
      lastname: 'Mehmood',
      totalprice: 175,
      depositpaid: true,
      bookingdates: { checkin: '2026-11-20', checkout: '2026-11-25' },
      additionalneeds: 'Tea',
    });
    const replacedPayload: Booking = {
      ...createdPayload,
      lastname: 'Updated',
      totalprice: 210,
      depositpaid: false,
      bookingdates: { checkin: '2026-11-21', checkout: '2026-11-26' },
      additionalneeds: 'Coffee',
    };
    let id: number | undefined;

    try {
      await test.step('create the booking', async () => {
        const response = await booker.createBooking(createdPayload);
        expectStatus(response, 200);
        expectJsonContentType(response);
        expectSchema(response, 'booker/booking-created.schema.json');
        const body = asRecord(response.body, 'create booking');
        id = body.bookingid as number;
        expect(id).toBeGreaterThan(0);
        expectBooking(body.booking, createdPayload);
      });

      await test.step('read the booking back', async () => {
        const response = await readBookingMatching(booker, requiredId(id), createdPayload);
        expectStatus(response, 200);
        expectSchema(response, 'booker/booking.schema.json');
        expectBooking(response.body, createdPayload);
      });

      await test.step('replace the booking', async () => {
        const response = await booker.updateBooking(requiredId(id), replacedPayload);
        expectStatus(response, 200);
        expectJsonContentType(response);
        expectSchema(response, 'booker/booking.schema.json');
        expectBooking(response.body, replacedPayload);
      });

      await test.step('read the replacement', async () => {
        const response = await readBookingMatching(booker, requiredId(id), replacedPayload);
        expectStatus(response, 200);
        expectBooking(response.body, replacedPayload);
      });

      const patchedNeeds = 'Late checkout';

      await test.step('patch one field', async () => {
        const response = await booker.patchBooking(requiredId(id), {
          additionalneeds: patchedNeeds,
        });
        expectStatus(response, 200);
        expectSchema(response, 'booker/booking.schema.json');
        expectBooking(response.body, { ...replacedPayload, additionalneeds: patchedNeeds });
      });

      await test.step('read the patch', async () => {
        const response = await readBookingMatching(booker, requiredId(id), {
          firstname: replacedPayload.firstname,
          additionalneeds: patchedNeeds,
        });
        expectStatus(response, 200);
        expect(asRecord(response.body, 'patched booking').additionalneeds).toBe(patchedNeeds);
        expect(asRecord(response.body, 'patched booking').totalprice).toBe(
          replacedPayload.totalprice,
        );
      });

      await test.step('delete the booking', async () => {
        const response = await booker.deleteBooking(requiredId(id));
        // This host answers a successful delete with HTTP 201 and the text "Created".
        expectStatus(response, 201);
        expect(String(response.body).trim()).toBe('Created');
      });

      await test.step('confirm the booking is gone', async () => {
        const response = await waitForBookingStatus(booker, requiredId(id), 404);
        expectStatus(response, 404);
        expect(String(response.body).trim()).toBe('Not Found');
      });
    } finally {
      await deleteBookingQuietly(booker, id);
    }
  });
});

function requiredId(id: number | undefined): number {
  expect(id, 'booking id should have been captured from the create response').toEqual(
    expect.any(Number),
  );
  return id as number;
}
