import { test, expect } from '../../src/saucedemo/fixtures';
import { ACCEPTED_USERS, CUSTOMER, MESSAGES, PRODUCTS, TAX_RATE, USERS, product, toCents, type Product } from '../../src/saucedemo/data';
import { expectKnownDefect } from '../../src/saucedemo/known-defects';

const backpack = product('Sauce Labs Backpack');
const bikeLight = product('Sauce Labs Bike Light');

test.describe('Checkout', () => {
  for (const user of ACCEPTED_USERS) {
    test(`TC-SD-022 ${user} completes a purchase @p1 @smoke`, async ({ loginAs, inventory, cart, checkout }) => {
      expectKnownDefect('TC-SD-022', user);
      await loginAs(user);
      await inventory.add(backpack, bikeLight);
      await inventory.openCart();
      await cart.checkout();
      await checkout.submitInformation(CUSTOMER);
      await checkout.expectOnOverview();
      expect(await checkout.amounts()).toEqual({ subtotal: 39.98, tax: 3.2, total: 43.18 });
      await checkout.finish();
      await expect(checkout.completeHeader).toHaveText(MESSAGES.orderComplete);
      await inventory.expectCartCount(0);
    });

    test(`TC-SD-024 ${user} fields keep what was typed @p1`, async ({ loginAs, cart, checkout }) => {
      expectKnownDefect('TC-SD-024', user);
      await loginAs(user);
      await cart.open();
      await cart.checkout();
      await checkout.fillInformation(CUSTOMER);
      await expect(checkout.firstName).toHaveValue(CUSTOMER.firstName);
      await expect(checkout.lastName).toHaveValue(CUSTOMER.lastName);
      await expect(checkout.postalCode).toHaveValue(CUSTOMER.postalCode);
    });
  }

  test.describe('standard_user', () => {
    test.beforeEach(async ({ loginAs, inventory, cart }) => {
      await loginAs(USERS.standard);
      await inventory.add(backpack);
      await inventory.openCart();
      await cart.checkout();
    });

    // Decision table: the first missing field (in form order) is the one reported.
    const rules = [
      { first: '', last: '', postal: '', error: MESSAGES.firstNameRequired },
      { first: '', last: 'Silva', postal: '86000', error: MESSAGES.firstNameRequired },
      { first: 'Ana', last: '', postal: '', error: MESSAGES.lastNameRequired },
      { first: 'Ana', last: '', postal: '86000', error: MESSAGES.lastNameRequired },
      { first: 'Ana', last: 'Silva', postal: '', error: MESSAGES.postalCodeRequired },
    ];
    for (const r of rules) {
      const name = `first=${r.first ? 'filled' : 'empty'} last=${r.last ? 'filled' : 'empty'} postal=${r.postal ? 'filled' : 'empty'}`;
      test(`TC-SD-023 required fields: ${name} @p1`, async ({ page, checkout }) => {
        await checkout.submitInformation({ firstName: r.first, lastName: r.last, postalCode: r.postal });
        await expect(checkout.error).toHaveText(r.error);
        await expect(page).toHaveURL(/checkout-step-one\.html$/);
      });
    }

    test('TC-SD-026 cancel from step one keeps the cart @p3', async ({ page, checkout, cart }) => {
      await checkout.cancelButton.click();
      await expect(page).toHaveURL(/cart\.html$/);
      await expect(cart.itemNames).toHaveText([backpack.name]);
    });

    test('TC-SD-027 cancel from overview keeps the cart @p3', async ({ checkout, inventory }) => {
      await checkout.submitInformation(CUSTOMER);
      await checkout.expectOnOverview();
      await checkout.cancelButton.click();
      await inventory.expectLoaded();
      await inventory.expectCartCount(1);
    });

    const inputs = [
      { name: 'long input (255 characters)', value: 'A'.repeat(255) },
      { name: 'accented characters', value: 'João Conceição' },
      { name: 'markup is treated as text', value: '<img src=x onerror="window.__injected=1">' },
    ];
    for (const i of inputs) {
      test(`TC-SD-029 ${i.name} @p3`, async ({ page, checkout }) => {
        await checkout.fillInformation({ firstName: i.value, lastName: i.value, postalCode: '86000' });
        await expect(checkout.firstName).toHaveValue(i.value);
        await checkout.continueButton.click();
        await checkout.expectOnOverview();
        expect(await page.evaluate(() => (window as unknown as { __injected?: number }).__injected)).toBeUndefined();
      });
    }
  });

  const carts: { name: string; items: Product[] }[] = [
    { name: 'cheapest item', items: [product('Sauce Labs Onesie')] },
    { name: 'most expensive item', items: [product('Sauce Labs Fleece Jacket')] },
    { name: 'all 6 items', items: PRODUCTS },
  ];
  for (const c of carts) {
    test(`TC-SD-025 tax and total: ${c.name} @p1`, async ({ loginAs, inventory, cart, checkout }) => {
      await loginAs(USERS.standard);
      await inventory.add(...c.items);
      await inventory.openCart();
      await cart.checkout();
      await checkout.submitInformation(CUSTOMER);
      await checkout.expectOnOverview();
      const subtotal = toCents(c.items.reduce((sum, p) => sum + p.price, 0));
      const tax = toCents(subtotal * TAX_RATE);
      expect(await checkout.amounts()).toEqual({ subtotal, tax, total: toCents(subtotal + tax) });
    });
  }
});
