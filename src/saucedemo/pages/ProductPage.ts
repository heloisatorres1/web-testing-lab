import type { Locator, Page } from '@playwright/test';

export class ProductPage {
  /** The detail card. Scoping to it matters: during navigation the old list can still be in the DOM. */
  readonly details: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.details = page.getByTestId('inventory-container').filter({ has: page.locator('.inventory_details_container') });
    this.name = this.details.getByTestId('inventory-item-name');
    this.description = this.details.getByTestId('inventory-item-desc');
    this.price = this.details.getByTestId('inventory-item-price');
    this.addButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backButton = page.getByTestId('back-to-products');
  }
}
