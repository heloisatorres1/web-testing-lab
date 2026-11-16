import { test, expect } from '../../src/saucedemo/fixtures';
import { ACCEPTED_USERS, PRODUCTS, USERS, product } from '../../src/saucedemo/data';
import { expectKnownDefect } from '../../src/saucedemo/known-defects';

const backpack = product('Sauce Labs Backpack');
const bikeLight = product('Sauce Labs Bike Light');

test.describe('Cart', () => {
  test.describe('standard_user', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs(USERS.standard);
    });

    test('TC-SD-015 add one item @p1 @smoke', async ({ inventory }) => {
      await inventory.add(backpack);
      await inventory.expectCartCount(1);
      await expect(inventory.removeButton(backpack)).toBeVisible();
    });

    test('TC-SD-017 remove from catalog @p2', async ({ inventory }) => {
      await inventory.add(backpack, bikeLight);
      await inventory.remove(backpack);
      await inventory.expectCartCount(1);
      await expect(inventory.addButton(backpack)).toBeVisible();
    });

    test('TC-SD-018 remove last item from cart page @p2', async ({ inventory, cart }) => {
      await inventory.add(backpack);
      await inventory.openCart();
      await cart.remove(backpack);
      await expect(cart.items).toHaveCount(0);
      await inventory.expectCartCount(0);
    });

    test('TC-SD-019 add from product detail page @p2', async ({ inventory, productPage }) => {
      await inventory.openProduct(bikeLight);
      await productPage.addButton.click();
      await expect(productPage.removeButton).toBeVisible();
      await inventory.expectCartCount(1);
      await productPage.backButton.click();
      await expect(inventory.removeButton(bikeLight)).toBeVisible();
    });

    test('TC-SD-020 cart survives reload @p2', async ({ page, inventory }) => {
      await inventory.add(backpack, bikeLight);
      await page.reload();
      await inventory.expectCartCount(2);
    });

    test('TC-SD-021 Reset App State empties the cart @p2', async ({ page, inventory, menu }) => {
      await inventory.add(backpack, bikeLight);
      await menu.resetAppState();
      await inventory.expectCartCount(0);
      // The buttons only refresh after the page is shown again.
      await page.reload();
      await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(0);
    });
  });

  for (const user of ACCEPTED_USERS) {
    test(`TC-SD-016 ${user} can add all 6 products @p1`, async ({ loginAs, inventory, cart }) => {
      expectKnownDefect('TC-SD-016', user);
      await loginAs(user);
      for (const p of PRODUCTS) {
        await test.step(`add ${p.name}`, async () => {
          await inventory.addButton(p).click();
          await expect.soft(inventory.removeButton(p), `${p.name} shows Remove`).toBeVisible({ timeout: 2000 });
        });
      }
      await inventory.expectCartCount(PRODUCTS.length);
      await inventory.openCart();
      await expect(cart.itemNames).toHaveText(PRODUCTS.map((p) => p.name), { ignoreCase: false });
    });
  }
});
