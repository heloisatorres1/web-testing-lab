import { test, expect } from '../../src/saucedemo/fixtures';
import { ACCEPTED_USERS, MESSAGES, PASSWORD, PRODUCTS, USERS } from '../../src/saucedemo/data';
import { expectKnownDefect } from '../../src/saucedemo/known-defects';

test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('TC-SD-001 valid user lands on Products @p1 @smoke', async ({ loginPage, inventory }) => {
    await loginPage.login(USERS.standard);
    await inventory.expectLoaded();
  });

  for (const user of ACCEPTED_USERS.filter((u) => u !== USERS.standard)) {
    test(`TC-SD-002 ${user} can log in @p1`, async ({ loginPage, inventory }) => {
      await loginPage.login(user);
      await inventory.expectLoaded();
    });
  }

  const refused = [
    { id: 'TC-SD-003', name: 'empty form', user: '', password: '', message: MESSAGES.usernameRequired },
    { id: 'TC-SD-004', name: 'missing password', user: USERS.standard, password: '', message: MESSAGES.passwordRequired },
    { id: 'TC-SD-005', name: 'wrong password', user: USERS.standard, password: 'wrong', message: MESSAGES.wrongCredentials },
    { id: 'TC-SD-006', name: 'locked out user', user: USERS.lockedOut, password: PASSWORD, message: MESSAGES.lockedOut },
  ];
  for (const c of refused) {
    test(`${c.id} login refused: ${c.name} @p1`, async ({ page, loginPage }) => {
      await loginPage.login(c.user, c.password);
      await loginPage.expectError(c.message);
      await expect(page).toHaveURL(/saucedemo\.com\/$/);
    });
  }

  test('TC-SD-007 login error can be dismissed @p3', async ({ loginPage }) => {
    await loginPage.login('', '');
    await expect(loginPage.error).toBeVisible();
    await loginPage.errorClose.click();
    await expect(loginPage.error).toBeHidden();
  });

  for (const path of ['/inventory.html', '/cart.html', '/checkout-step-one.html']) {
    test(`TC-SD-008 ${path} needs a session @p1`, async ({ page, loginPage }) => {
      await page.goto(`https://www.saucedemo.com${path}`);
      await loginPage.expectError(MESSAGES.loginRequired(path));
      await expect(loginPage.loginButton).toBeVisible();
    });
  }

  test('TC-SD-009 logout ends the session @p1', async ({ page, loginAs, menu, loginPage, inventory }) => {
    await loginAs(USERS.standard);
    await menu.logOut();
    await expect(loginPage.loginButton).toBeVisible();
    await page.goBack();
    await expect(inventory.items).toHaveCount(0);
    await inventory.open();
    await loginPage.expectError(MESSAGES.loginRequired('/inventory.html'));
  });

  test('TC-SD-037 next user does not inherit the cart @p1', async ({ loginAs, inventory, menu }) => {
    expectKnownDefect('TC-SD-037', USERS.standard);
    await loginAs(USERS.standard);
    await inventory.add(PRODUCTS[0], PRODUCTS[4]);
    await inventory.expectCartCount(2);
    await menu.logOut();

    await loginAs(USERS.visual);
    await inventory.expectCartCount(0);
  });
});
