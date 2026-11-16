import { test as base, expect } from '@playwright/test';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DynamicCatalogPage } from './pages/DynamicCatalogPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { ProductPage } from './pages/ProductPage';
import { SideMenu } from './pages/SideMenu';
import { SAUCEDEMO_URL, USERS, type Username } from './data';

export interface ShopFixtures {
  loginPage: LoginPage;
  inventory: InventoryPage;
  productPage: ProductPage;
  cart: CartPage;
  checkout: CheckoutPage;
  menu: SideMenu;
  dynamicCatalog: DynamicCatalogPage;
  /** Logs in as the given user and waits for the Products page. */
  loginAs: (user?: Username) => Promise<void>;
}

export const test = base.extend<ShopFixtures>({
  baseURL: SAUCEDEMO_URL,
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventory: async ({ page }, use) => use(new InventoryPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cart: async ({ page }, use) => use(new CartPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  menu: async ({ page }, use) => use(new SideMenu(page)),
  dynamicCatalog: async ({ page }, use) => use(new DynamicCatalogPage(page)),
  loginAs: async ({ loginPage, inventory }, use) => {
    await use(async (user = USERS.standard) => {
      await loginPage.open();
      await loginPage.login(user);
      await inventory.expectLoaded();
    });
  },
});

export { expect };
