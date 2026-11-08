import { test, expect } from '../../fixtures/api.fixture';
import type { Booking } from '../../src/domain/booking';
import { schemaValidator } from '../../src/validation/schema-validator';

const booking: Booking = {
  firstname: 'Hassan',
  lastname: 'Mehmood',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2026-11-01', checkout: '2026-11-08' },
  additionalneeds: 'Breakfast',
};

test.describe('schema validator', { tag: ['@schema'] }, () => {
  test('accepts a complete booking document', () => {
    const result = schemaValidator.validate('booker/booking.schema.json', booking);
    expect(result.valid, result.errors).toBe(true);
  });

  test('accepts a create response that references the booking schema', () => {
    const result = schemaValidator.validate('booker/booking-created.schema.json', {
      bookingid: 10,
      booking,
    });
    expect(result.valid, result.errors).toBe(true);
  });

  test('reports missing required booking fields', () => {
    const result = schemaValidator.validate('booker/booking.schema.json', { firstname: 'Hassan' });
    expect(result.valid).toBe(false);
    expect(result.errors).toMatch(/required property 'lastname'/);
  });

  test('rejects a booking date that is not ISO-8601', () => {
    const result = schemaValidator.validate('booker/booking.schema.json', {
      ...booking,
      bookingdates: { checkin: '11/01/2026', checkout: '2026-11-08' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toMatch(/checkin/);
  });

  test('fails clearly when a schema file is not registered', () => {
    expect(() => schemaValidator.validate('missing/nope.schema.json', {})).toThrow(
      /No schema registered for missing\/nope\.schema\.json/,
    );
  });
});
