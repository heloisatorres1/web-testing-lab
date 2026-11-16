import { expect, type Locator, type Page } from '@playwright/test';
import { SAUCEDEMO_URL, type Product } from '../data';

export class CartPage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShopping: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShopping = page.getByTestId('continue-shopping');
  }

  async open() {
    await this.page.goto(`${SAUCEDEMO_URL}/cart.html`);
  }

  async remove(product: Product) {
    await this.page.getByTestId(`remove-${product.id}`).click();
  }

  /**
   * Opens checkout and waits until the form is ready. Typing while the page is still
   * rendering can be wiped by that render (seen in WebKit under parallel load), which is a
   * test timing problem, not something a person can do.
   */
  async checkout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one.html$/);
    await expect(this.page.getByTestId('title')).toHaveText('Checkout: Your Information');
    await expect(this.page.getByTestId('firstName')).toBeEditable();
  }
}
