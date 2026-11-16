import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/saucedemo/fixtures';
import { ACCEPTED_USERS, CUSTOMER, MESSAGES, USERS, product } from '../../src/saucedemo/data';
import { expectKnownDefect } from '../../src/saucedemo/known-defects';

const LOGIN_BUDGET_MS = 2_000;

test.describe('Response time', () => {
  for (const user of ACCEPTED_USERS) {
    test(`TC-SD-033 ${user} logs in within ${LOGIN_BUDGET_MS / 1000} s @p2`, async ({ loginPage, inventory }) => {
      expectKnownDefect('TC-SD-033', user);
      await loginPage.open();
      await loginPage.username.fill(user);
      await loginPage.password.fill('secret_sauce');
      const start = Date.now();
      await loginPage.loginButton.click();
      await expect(inventory.items.first()).toBeVisible({ timeout: 15_000 });
      const elapsed = Date.now() - start;
      test.info().annotations.push({ type: 'login time', description: `${elapsed} ms` });
      expect(elapsed, `login took ${elapsed} ms`).toBeLessThan(LOGIN_BUDGET_MS);
    });
  }
});

test.describe('Accessibility', () => {
  /** Only critical and serious problems fail the test; the full list is attached to the report. */
  async function scan(page: import('@playwright/test').Page, name: string) {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    await test.info().attach(`axe-${name}.json`, { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
    return result.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s)`);
  }

  test('TC-SD-034 key pages have no critical or serious violations @p3', async ({ page, loginPage, loginAs, inventory, cart, checkout }) => {
    const found: Record<string, string[]> = {};
    await loginPage.open();
    found.login = await scan(page, 'login');
    await loginAs(USERS.standard);
    found.products = await scan(page, 'products');
    await inventory.add(product('Sauce Labs Backpack'));
    await inventory.openCart();
    found.cart = await scan(page, 'cart');
    await cart.checkout();
    found.checkout = await scan(page, 'checkout');
    expect(found).toEqual({ login: [], products: [], cart: [], checkout: [] });
  });
});

test.describe('Mobile', () => {
  test('TC-SD-036 purchase works on a phone without horizontal scroll @p3 @mobile', async ({ page, loginAs, inventory, cart, checkout }) => {
    await loginAs(USERS.standard);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow(), 'Products page overflow').toBeLessThanOrEqual(0);
    await inventory.add(product('Sauce Labs Onesie'));
    await inventory.openCart();
    await cart.checkout();
    expect(await overflow(), 'checkout overflow').toBeLessThanOrEqual(0);
    await checkout.submitInformation(CUSTOMER);
    await checkout.finish();
    await expect(checkout.completeHeader).toHaveText(MESSAGES.orderComplete);
  });
});
