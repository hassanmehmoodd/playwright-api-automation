import { test, expect } from '../../fixtures/api.fixture';
import seeds from '../../test-data/bookings.json';
import { withUniqueFirstname, type Booking } from '../../src/domain/booking';
import { asRecord, expectSchema, expectStatus } from '../../src/validation/assertions';
import { schemaValidator } from '../../src/validation/schema-validator';
import { deleteBookingQuietly, expectBooking, readBookingMatching } from '../support/booker-flow';

const bookings = seeds as Booking[];

test.describe(
  'data-driven booking contracts',
  { tag: ['@booker', '@data-driven', '@positive'] },
  () => {
    for (const seed of bookings) {
      test(`creates and reads a booking for ${seed.firstname} ${seed.lastname}`, async ({
        booker,
      }) => {
        const payload = withUniqueFirstname(seed);
        const payloadCheck = schemaValidator.validate('booker/booking.schema.json', payload);
        expect(payloadCheck.valid, payloadCheck.errors).toBe(true);

        let id: number | undefined;
        try {
          const created = await booker.createBooking(payload);
          expectStatus(created, 200);
          expectSchema(created, 'booker/booking-created.schema.json');
          id = asRecord(created.body, 'created booking').bookingid as number;
          expect(id).toBeGreaterThan(0);

          const fetched = await readBookingMatching(booker, id, payload);
          expectStatus(fetched, 200);
          expectSchema(fetched, 'booker/booking.schema.json');
          expectBooking(fetched.body, payload);
        } finally {
          await deleteBookingQuietly(booker, id);
        }
      });
    }
  },
);
