import { test, expect } from '@playwright/test';
import { PETSTORE_URL, expectJson, expectValid, newPet, swaggerValidator, uniqueId, type Pet } from '../../src/api/clients';

// Petstore is shared with the whole internet: every test owns the data it creates and removes it afterwards.
test.describe('Petstore API', () => {
  const created: number[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of created.splice(0)) await request.delete(`${PETSTORE_URL}/pet/${id}`);
  });

  test('TC-PS-001 create, read, update and delete a pet (contract-checked) @p1 @smoke', async ({ request }) => {
    const validate = await swaggerValidator(request, 'Pet');
    const pet = newPet();
    created.push(pet.id);

    const createdBody = await expectJson(await request.post(`${PETSTORE_URL}/pet`, { data: pet }), 200);
    expectValid(validate, createdBody, 'POST /pet response');
    expect(createdBody).toMatchObject({ id: pet.id, name: pet.name, status: 'available' });

    await expect
      .poll(async () => (await request.get(`${PETSTORE_URL}/pet/${pet.id}`)).status(), { message: 'pet is readable', timeout: 15_000 })
      .toBe(200);
    const read = await (await request.get(`${PETSTORE_URL}/pet/${pet.id}`)).json();
    expectValid(validate, read, 'GET /pet/{id} response');
    expect(read).toMatchObject({ id: pet.id, name: pet.name });

    const updated: Pet = { ...pet, name: `${pet.name}-sold`, status: 'sold' };
    const updatedBody = await expectJson(await request.put(`${PETSTORE_URL}/pet`, { data: updated }), 200);
    expect(updatedBody).toMatchObject({ name: updated.name, status: 'sold' });

    expect((await request.delete(`${PETSTORE_URL}/pet/${pet.id}`)).status()).toBe(200);
    created.length = 0;
    await expect
      .poll(async () => (await request.get(`${PETSTORE_URL}/pet/${pet.id}`)).status(), { message: 'pet is gone', timeout: 15_000 })
      .toBe(404);
  });

  test('TC-PS-002 reading an unknown pet returns 404 with an error body @p1', async ({ request }) => {
    const res = await request.get(`${PETSTORE_URL}/pet/${uniqueId()}`);
    const body = await expectJson(res, 404);
    expect(body).toMatchObject({ code: 1, type: 'error', message: 'Pet not found' });
  });

  test('TC-PS-003 a non-numeric pet id is rejected with 404 @p2', async ({ request }) => {
    const res = await request.get(`${PETSTORE_URL}/pet/not-a-number`);
    expect(res.status()).toBe(404);
    expect((await res.json()).message).toMatch(/NumberFormatException|not found/i);
  });

  test('TC-PS-004 deleting an unknown pet returns 404 @p2', async ({ request }) => {
    expect((await request.delete(`${PETSTORE_URL}/pet/${uniqueId()}`)).status()).toBe(404);
  });

  for (const status of ['available', 'pending', 'sold'] as const) {
    test(`TC-PS-005 findByStatus=${status} only returns ${status} pets and matches the contract @p2`, async ({ request }) => {
      const validate = await swaggerValidator(request, 'Pet');
      const body: Pet[] = await expectJson(await request.get(`${PETSTORE_URL}/pet/findByStatus`, { params: { status } }), 200);
      expect(Array.isArray(body)).toBe(true);
      const wrongStatus = body.filter((p) => p.status !== status);
      expect(wrongStatus, 'pets with another status').toEqual([]);
      const mine = newPet({ status });
      created.push(mine.id);
      await expectJson(await request.post(`${PETSTORE_URL}/pet`, { data: mine }), 200);
      await expect
        .poll(async () => ((await (await request.get(`${PETSTORE_URL}/pet/findByStatus`, { params: { status } })).json()) as Pet[]).some((p) => p.id === mine.id), {
          message: 'the new pet is listed',
          timeout: 15_000,
        })
        .toBe(true);
      const listed = ((await (await request.get(`${PETSTORE_URL}/pet/findByStatus`, { params: { status } })).json()) as Pet[]).find((p) => p.id === mine.id);
      expectValid(validate, listed, 'the listed pet');
    });
  }

  test('TC-PS-010 the server refuses a pet without the required name @p2', async ({ request }) => {
    test.fail(true, 'BUG-010: Petstore stores pets that break its own contract (docs/bug-reports/BUG-010.md)');
    test.info().annotations.push({ type: 'issue', description: 'BUG-010' });
    const id = uniqueId();
    created.push(id);
    const res = await request.post(`${PETSTORE_URL}/pet`, { data: { id, photoUrls: [] } });
    expect([400, 405, 422], `status ${res.status()}`).toContain(res.status());
  });

  test('TC-PS-006 findByStatus with an invalid value returns an empty list, not an error @p3', async ({ request }) => {
    const body = await expectJson(await request.get(`${PETSTORE_URL}/pet/findByStatus`, { params: { status: 'flying' } }), 200);
    expect(body).toEqual([]);
  });

  test('TC-PS-007 store inventory lists counts per status @p3', async ({ request }) => {
    const body = await expectJson(await request.get(`${PETSTORE_URL}/store/inventory`), 200);
    for (const [key, value] of Object.entries(body)) {
      expect(typeof key).toBe('string');
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  test('TC-PS-008 placing an order for a pet returns the order with its id @p2', async ({ request }) => {
    const validate = await swaggerValidator(request, 'Order');
    const pet = newPet();
    created.push(pet.id);
    await expectJson(await request.post(`${PETSTORE_URL}/pet`, { data: pet }), 200);

    const order = { id: uniqueId(), petId: pet.id, quantity: 1, shipDate: new Date().toISOString(), status: 'placed', complete: false };
    const body = await expectJson(await request.post(`${PETSTORE_URL}/store/order`, { data: order }), 200);
    expectValid(validate, body, 'POST /store/order response');
    expect(body).toMatchObject({ id: order.id, petId: pet.id, quantity: 1, status: 'placed' });
    await request.delete(`${PETSTORE_URL}/store/order/${order.id}`);
  });

  test('TC-PS-009 responses arrive within 3 seconds @p3', async ({ request }) => {
    const start = Date.now();
    await request.get(`${PETSTORE_URL}/store/inventory`);
    const elapsed = Date.now() - start;
    test.info().annotations.push({ type: 'response time', description: `${elapsed} ms` });
    expect(elapsed).toBeLessThan(3_000);
  });
});
