import type { Booking } from '../../src/domain/booking';
import type { ApiResponse } from '../../src/http/api-client';
import type { BookerService } from '../../src/services/booker.service';
import { expectStatus, expectSchema, asRecord } from '../../src/validation/assertions';
import { expect } from '../../fixtures/api.fixture';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function expectBooking(actual: unknown, expected: Booking): void {
  const booking = asRecord(actual, 'booking');
  const dates = asRecord(booking.bookingdates, 'booking dates');
  expect(booking.firstname).toBe(expected.firstname);
  expect(booking.lastname).toBe(expected.lastname);
  expect(booking.totalprice).toBe(expected.totalprice);
  expect(booking.depositpaid).toBe(expected.depositpaid);
  expect(dates.checkin).toBe(expected.bookingdates.checkin);
  expect(dates.checkout).toBe(expected.bookingdates.checkout);
  expect(String(dates.checkin) < String(dates.checkout)).toBe(true);
  if (expected.additionalneeds !== undefined) {
    expect(booking.additionalneeds).toBe(expected.additionalneeds);
  }
}

/**
 * The public booking list changes as other people delete rows.
 * Walk a short prefix until one id still exists.
 */
export async function readFirstAvailableBooking(booker: BookerService): Promise<ApiResponse> {
  const list = await booker.listBookings();
  expectStatus(list, 200);
  expectSchema(list, 'booker/booking-id-list.schema.json');
  const ids = list.body as Array<{ bookingid: number }>;
  for (const entry of ids.slice(0, 5)) {
    const response = await booker.getBooking(entry.bookingid);
    if (response.status === 200) return response;
  }
  throw new Error('None of the first five booking ids returned HTTP 200.');
}

/**
 * Restful Booker can acknowledge a write before the following read sees it.
 * Poll briefly, then return the last response for the caller to assert.
 */
export async function readBookingMatching(
  booker: BookerService,
  id: number,
  expected: Pick<Booking, 'firstname' | 'additionalneeds'>,
): Promise<ApiResponse> {
  let last = await booker.getBooking(id);
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    if (last.status === 200 && bookingEchoes(last.body, expected)) return last;
    await delay(400 * attempt);
    last = await booker.getBooking(id);
  }
  return last;
}

export async function deleteBookingQuietly(
  booker: BookerService,
  id: number | undefined,
): Promise<void> {
  if (id === undefined) return;
  await booker.deleteBooking(id);
}

export async function waitForBookingStatus(
  booker: BookerService,
  id: number,
  status: number,
): Promise<ApiResponse> {
  let last = await booker.getBooking(id);
  for (let attempt = 1; attempt <= 4 && last.status !== status; attempt += 1) {
    await delay(400 * attempt);
    last = await booker.getBooking(id);
  }
  return last;
}

function bookingEchoes(
  body: unknown,
  expected: Pick<Booking, 'firstname' | 'additionalneeds'>,
): boolean {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
  const booking = body as Record<string, unknown>;
  if (booking.firstname !== expected.firstname) return false;
  if (
    expected.additionalneeds !== undefined &&
    booking.additionalneeds !== expected.additionalneeds
  ) {
    return false;
  }
  return true;
}
