import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { MESSAGES, PRODUCTS, product, type Username } from '../../src/saucedemo/data';
import type { SortOption } from '../../src/saucedemo/pages/InventoryPage';

Given('I am on the Swag Labs login page', async ({ loginPage }) => {
  await loginPage.open();
});

Given('I log in as {string}', async ({ loginPage, inventory, page }, user: string) => {
  if (!page.url().includes('saucedemo.com') || page.url().endsWith('.html')) await loginPage.open();
  await loginPage.login(user as Username);
  await inventory.expectLoaded();
});

When('I log in with username {string} and password {string}', async ({ loginPage }, user: string, password: string) => {
  await loginPage.login(user, password);
});

Then('I see the Products page', async ({ inventory }) => {
  await inventory.expectLoaded();
});

Then('I see the login error {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});

Then('I stay on the login page', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(loginPage.loginButton).toBeVisible();
});

Given('I add {string} to the cart', async ({ inventory }, name: string) => {
  await inventory.add(product(name));
});

Given('I add {string} and {string} to the cart', async ({ inventory }, first: string, second: string) => {
  await inventory.add(product(first), product(second));
});

When('I log out', async ({ menu }) => {
  await menu.logOut();
});

Then('the cart is empty', async ({ inventory }) => {
  await inventory.expectCartCount(0);
});

Then('the cart badge shows {int}', async ({ inventory }, count: number) => {
  await inventory.expectCartCount(count);
});

When('I check out as {string} {string} with postal code {string}', async ({ inventory, cart, checkout }, first: string, last: string, postal: string) => {
  await inventory.openCart();
  await cart.checkout();
  await checkout.submitInformation({ firstName: first, lastName: last, postalCode: postal });
});

Then('the overview shows an item total of ${float}, tax of ${float} and a total of ${float}', async ({ checkout }, subtotal: number, tax: number, total: number) => {
  await checkout.expectOnOverview();
  expect(await checkout.amounts()).toEqual({ subtotal, tax, total });
});

When('I finish the order', async ({ checkout }) => {
  await checkout.finish();
});

Then('I see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
});

Then('I see the checkout error {string}', async ({ checkout }, message: string) => {
  await expect(checkout.error).toHaveText(message);
});

const SORT_OPTIONS: Record<string, SortOption> = {
  'Name (A to Z)': 'az',
  'Name (Z to A)': 'za',
  'Price (low to high)': 'lohi',
  'Price (high to low)': 'hilo',
};

When('I sort the products by {string}', async ({ inventory }, label: string) => {
  await inventory.sortBy(SORT_OPTIONS[label]);
});

Then('the products are ordered by {word} {word}', async ({ inventory }, key: string, direction: string) => {
  const dir = direction === 'ascending' ? 1 : -1;
  if (key === 'name') {
    const expected = PRODUCTS.map((p) => p.name).sort((a, b) => a.localeCompare(b) * dir);
    await expect(inventory.itemNames).toHaveText(expected);
  } else {
    const prices = await inventory.prices();
    expect(prices).toEqual([...prices].sort((a, b) => (a - b) * dir));
  }
});

export { MESSAGES };
