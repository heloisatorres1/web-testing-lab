import type { Locator, Page } from '@playwright/test';

export class DynamicCatalogPage {
  readonly lazyNames: Locator;
  readonly lazyPrices: Locator;
  readonly lazyPlaceholders: Locator;
  readonly lazySentinel: Locator;
  readonly spinnerNames: Locator;
  readonly spinnerPrices: Locator;
  readonly sliderName: Locator;

  constructor(private readonly page: Page) {
    this.lazyNames = page.locator('[data-test^="lazy-load-item-"][data-test$="-name"]');
    this.lazyPrices = page.locator('[data-test^="lazy-load-item-"][data-test$="-price"]');
    this.lazyPlaceholders = page.locator('[data-test^="lazy-load-item-"][data-test$="-placeholder"]');
    this.lazySentinel = page.getByTestId('dynamic-catalog-lazy-load-sentinel');
    this.spinnerNames = page.locator('[data-test^="spinner-item-"][data-test$="-name"]');
    this.spinnerPrices = page.locator('[data-test^="spinner-item-"][data-test$="-price"]');
    this.sliderName = page.getByTestId('dynamic-catalog-slider-item-name');
  }

  sliderDot(index: number) {
    return this.page.getByTestId(`dynamic-catalog-slider-dot-${index}`);
  }

  /** Scrolls the lazy-load list to its current end so the next batch starts loading. */
  async scrollToEnd() {
    await this.lazySentinel.scrollIntoViewIfNeeded();
  }
}
