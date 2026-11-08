export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: {
    checkin: string;
    checkout: string;
  };
  additionalneeds?: string;
}

export function withUniqueFirstname(booking: Booking): Booking {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return {
    ...booking,
    firstname: `${booking.firstname}${suffix}`.slice(0, 30),
  };
}
