import { expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export const PETSTORE_URL = 'https://petstore.swagger.io/v2';
export const BOOKER_URL = 'https://restful-booker.herokuapp.com';

/** IDs above the range other people use, so a run never collides with somebody else's pet. */
export function uniqueId() {
  return 900_000_000_000 + Math.floor(Math.random() * 1_000_000_000);
}

export const newPet = (overrides: Partial<Pet> = {}): Pet => ({
  id: uniqueId(),
  name: `wtl-pet-${Date.now()}`,
  photoUrls: ['https://example.com/photo.jpg'],
  status: 'available',
  category: { id: 1, name: 'Dogs' },
  tags: [{ id: 1, name: 'portfolio' }],
  ...overrides,
});

export interface Pet {
  id: number;
  name: string;
  photoUrls: string[];
  status: 'available' | 'pending' | 'sold';
  category?: { id: number; name: string };
  tags?: { id: number; name: string }[];
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

export const newBooking = (overrides: Partial<Booking> = {}): Booking => ({
  firstname: 'Ana',
  lastname: `Silva-${Date.now()}`,
  totalprice: 350,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
  ...overrides,
});

/** Compiles a validator for one definition of the published Swagger 2.0 document. */
export async function swaggerValidator(api: APIRequestContext, definition: string): Promise<ValidateFunction> {
  const swagger = await (await api.get(`${PETSTORE_URL}/swagger.json`)).json();
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv.compile({ $ref: `#/definitions/${definition}`, definitions: swagger.definitions });
}

export function expectValid(validate: ValidateFunction, body: unknown, what: string) {
  const ok = validate(body);
  expect(ok, `${what} matches the contract: ${JSON.stringify(validate.errors)}`).toBe(true);
}

export async function expectJson(response: APIResponse, status: number) {
  expect(response.status(), `${response.url()} -> ${response.status()}`).toBe(status);
  expect(response.headers()['content-type']).toContain('application/json');
  return response.json();
}

export async function bookerToken(api: APIRequestContext) {
  const res = await api.post(`${BOOKER_URL}/auth`, { data: { username: 'admin', password: 'password123' } });
  const body = await expectJson(res, 200);
  expect(body.token, 'auth token').toMatch(/^[a-z0-9]+$/);
  return body.token as string;
}

export async function newContext() {
  return request.newContext({ extraHTTPHeaders: { Accept: 'application/json' } });
}
