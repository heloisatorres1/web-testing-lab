import { test, expect, type APIRequestContext } from '@playwright/test';
import { BOOKER_URL, bookerToken, expectJson, newBooking, type Booking } from '../../src/api/clients';

test.describe('Restful-Booker API', () => {
  let token: string;
  const created: number[] = [];

  test.beforeAll(async ({ request }) => {
    token = await bookerToken(request);
  });

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await request.delete(`${BOOKER_URL}/booking/${id}`, { headers: { Cookie: `token=${token}` } });
  });

  async function create(request: APIRequestContext, booking: Booking) {
    const body = await expectJson(await request.post(`${BOOKER_URL}/booking`, { data: booking }), 200);
    created.push(body.bookingid);
    return body as { bookingid: number; booking: Booking };
  }

  test('TC-RB-001 health check responds @p1 @smoke', async ({ request }) => {
    expect((await request.get(`${BOOKER_URL}/ping`)).status()).toBe(201);
  });

  test('TC-RB-002 wrong credentials do not return a token @p1', async ({ request }) => {
    const body = await expectJson(await request.post(`${BOOKER_URL}/auth`, { data: { username: 'admin', password: 'wrong' } }), 200);
    expect(body).toEqual({ reason: 'Bad credentials' });
  });

  test('TC-RB-003 create a booking and read it back unchanged @p1 @smoke', async ({ request }) => {
    const booking = newBooking();
    const { bookingid, booking: echoed } = await create(request, booking);
    expect(bookingid).toBeGreaterThan(0);
    expect(echoed).toEqual(booking);

    const read = await expectJson(await request.get(`${BOOKER_URL}/booking/${bookingid}`), 200);
    expect(read).toEqual(booking);
  });

  test('TC-RB-004 bookings can be found by name @p2', async ({ request }) => {
    const booking = newBooking();
    const { bookingid } = await create(request, booking);
    const list = await expectJson(await request.get(`${BOOKER_URL}/booking`, { params: { firstname: booking.firstname, lastname: booking.lastname } }), 200);
    expect(list).toEqual([{ bookingid }]);
  });

  test('TC-RB-005 full update needs a token @p1', async ({ request }) => {
    const { bookingid } = await create(request, newBooking());
    const changed = newBooking({ firstname: 'Beatriz', totalprice: 999 });

    const forbidden = await request.put(`${BOOKER_URL}/booking/${bookingid}`, { data: changed });
    expect(forbidden.status()).toBe(403);

    const ok = await expectJson(await request.put(`${BOOKER_URL}/booking/${bookingid}`, { data: changed, headers: { Cookie: `token=${token}` } }), 200);
    expect(ok).toEqual(changed);
  });

  test('TC-RB-006 partial update changes only the given fields @p2', async ({ request }) => {
    const booking = newBooking();
    const { bookingid } = await create(request, booking);
    const patched = await expectJson(
      await request.patch(`${BOOKER_URL}/booking/${bookingid}`, { data: { totalprice: 1 }, headers: { Cookie: `token=${token}` } }),
      200,
    );
    expect(patched).toEqual({ ...booking, totalprice: 1 });
  });

  test('TC-RB-007 delete removes the booking @p1', async ({ request }) => {
    const { bookingid } = await create(request, newBooking());
    const res = await request.delete(`${BOOKER_URL}/booking/${bookingid}`, { headers: { Cookie: `token=${token}` } });
    expect(res.status()).toBe(201);
    created.length = 0;
    expect((await request.get(`${BOOKER_URL}/booking/${bookingid}`)).status()).toBe(404);
  });

  test('TC-RB-008 unknown booking returns 404 @p2', async ({ request }) => {
    expect((await request.get(`${BOOKER_URL}/booking/0`)).status()).toBe(404);
  });

  test('TC-RB-009 booking with missing required fields is refused @p2', async ({ request }) => {
    const res = await request.post(`${BOOKER_URL}/booking`, { data: { firstname: 'Only' } });
    expect(res.status(), 'incomplete booking').toBe(500);
  });

  test('TC-RB-010 boundary: checkout before checkin is accepted (open question for the product) @p3', async ({ request }) => {
    const booking = newBooking({ bookingdates: { checkin: '2026-12-05', checkout: '2026-12-01' } });
    const { booking: echoed } = await create(request, booking);
    test.info().annotations.push({ type: 'question', description: 'API stores a checkout date earlier than checkin. No contract rule forbids it; raised with the product owner.' });
    expect(echoed.bookingdates).toEqual(booking.bookingdates);
  });
});
