/**
 * Reproduces every confirmed SauceDemo defect and saves a screenshot per bug under
 * docs/bug-reports/evidence/. Run with: npm run evidence
 *
 * The same page objects the tests use drive the browser, so the evidence is taken from the
 * exact steps written in the bug reports.
 */
import { chromium, expect, selectors, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CartPage } from '../src/saucedemo/pages/CartPage';
import { CheckoutPage } from '../src/saucedemo/pages/CheckoutPage';
import { InventoryPage } from '../src/saucedemo/pages/InventoryPage';
import { LoginPage } from '../src/saucedemo/pages/LoginPage';
import { SideMenu } from '../src/saucedemo/pages/SideMenu';
import { CUSTOMER, PRODUCTS, USERS, product, type Username } from '../src/saucedemo/data';

// Outside the test runner the page objects still need the site's test-id attribute.
selectors.setTestIdAttribute('data-test');

const OUT = 'docs/bug-reports/evidence';
mkdirSync(OUT, { recursive: true });

async function login(page: Page, user: Username) {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(user);
  await new InventoryPage(page).expectLoaded();
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

const steps: Record<string, (page: Page) => Promise<void>> = {
  async 'BUG-001'(page) {
    const inventory = new InventoryPage(page);
    await login(page, USERS.standard);
    await inventory.add(product('Sauce Labs Backpack'), product('Sauce Labs Onesie'));
    await new SideMenu(page).logOut();
    await login(page, USERS.visual);
    await inventory.openCart();
    await expect(new CartPage(page).items).toHaveCount(2);
    await shot(page, 'BUG-001-cart-inherited-by-visual_user');
  },
  async 'BUG-002'(page) {
    await login(page, USERS.problem);
    await shot(page, 'BUG-002-problem_user-placeholder-images');
  },
  async 'BUG-003'(page) {
    const inventory = new InventoryPage(page);
    await login(page, USERS.problem);
    for (const p of PRODUCTS) await inventory.addButton(p).click({ timeout: 2_000 }).catch(() => undefined);
    await shot(page, 'BUG-003-problem_user-three-items-not-added');
  },
  async 'BUG-004'(page) {
    await login(page, USERS.problem);
    await new CartPage(page).open();
    await new CartPage(page).checkout();
    const checkout = new CheckoutPage(page);
    await checkout.firstName.fill(CUSTOMER.firstName);
    await checkout.lastName.fill(CUSTOMER.lastName);
    await checkout.postalCode.fill(CUSTOMER.postalCode);
    await checkout.continueButton.click();
    await expect(checkout.error).toBeVisible();
    await shot(page, 'BUG-004-problem_user-last-name-written-into-first-name');
  },
  async 'BUG-005'(page) {
    await login(page, USERS.error);
    await new CartPage(page).open();
    await new CartPage(page).checkout();
    const checkout = new CheckoutPage(page);
    await checkout.firstName.fill(CUSTOMER.firstName);
    await checkout.lastName.fill(CUSTOMER.lastName);
    await checkout.postalCode.fill(CUSTOMER.postalCode);
    await shot(page, 'BUG-005-error_user-last-name-stays-empty');
  },
  async 'BUG-006'(page) {
    const inventory = new InventoryPage(page);
    await login(page, USERS.error);
    await inventory.add(product('Sauce Labs Backpack'));
    await inventory.openCart();
    await new CartPage(page).checkout();
    const checkout = new CheckoutPage(page);
    await checkout.submitInformation({ firstName: 'Ana', lastName: 'x', postalCode: '86000' });
    await checkout.expectOnOverview();
    await checkout.finish();
    await page.waitForTimeout(1_000);
    await shot(page, 'BUG-006-error_user-finish-does-nothing');
  },
  async 'BUG-007'(page) {
    const inventory = new InventoryPage(page);
    await login(page, USERS.error);
    // A screenshot cannot be taken while a native alert is open, so its text is saved instead.
    const dialogs: string[] = [];
    page.on('dialog', async (d) => {
      dialogs.push(d.message());
      await d.dismiss();
    });
    await inventory.sortBy('za');
    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    writeFileSync(`${OUT}/BUG-007-error_user-sorting-alert.txt`, ['Alert shown after choosing "Name (Z to A)":', ...dialogs, ''].join('\n'));
    await shot(page, 'BUG-007-error_user-list-not-sorted');
  },
  async 'BUG-008'(page) {
    await login(page, USERS.visual);
    await shot(page, 'BUG-008-visual_user-wrong-prices');
  },
  async 'BUG-009'(page) {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.username.fill(USERS.performanceGlitch);
    await loginPage.password.fill('secret_sauce');
    const start = Date.now();
    await loginPage.loginButton.click();
    await expect(new InventoryPage(page).items.first()).toBeVisible({ timeout: 20_000 });
    console.log(`BUG-009 login time for performance_glitch_user: ${Date.now() - start} ms`);
  },
};

async function main() {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const [bug, run] of Object.entries(steps)) {
    if (only.length && !only.includes(bug)) continue;
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    try {
      await run(page);
      console.log(`${bug}: evidence captured`);
    } catch (e) {
      console.error(`${bug}: could not reproduce -> ${(e as Error).message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
}

void main();
