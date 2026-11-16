import { expect, type Locator, type Page } from '@playwright/test';
import { SAUCEDEMO_URL, type Product } from '../data';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly sort: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = page.locator('img.inventory_item_img');
    this.sort = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  async open() {
    await this.page.goto(`${SAUCEDEMO_URL}/inventory.html`);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.title).toHaveText('Products');
  }

  addButton(product: Product) {
    return this.page.getByTestId(`add-to-cart-${product.id}`);
  }

  removeButton(product: Product) {
    return this.page.getByTestId(`remove-${product.id}`);
  }

  async add(...products: Product[]) {
    for (const p of products) await this.addButton(p).click();
  }

  async remove(...products: Product[]) {
    for (const p of products) await this.removeButton(p).click();
  }

  async sortBy(option: SortOption) {
    await this.sort.selectOption(option);
  }

  async names() {
    return this.itemNames.allTextContents();
  }

  async prices() {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  /** Image source of every product card, in display order. */
  async imageSources() {
    return this.itemImages.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src') ?? ''));
  }

  async expectCartCount(count: number) {
    if (count === 0) await expect(this.cartBadge).toBeHidden();
    else await expect(this.cartBadge).toHaveText(String(count));
  }

  async openProduct(product: Product) {
    await this.itemNames.filter({ hasText: product.name }).click();
  }

  async openCart() {
    await this.cartLink.click();
  }
}
