import type { Locator, Page } from '@playwright/test';

export type DynamicPage = 'Lazy Load' | 'Spinner' | 'Slider';

export class SideMenu {
  readonly openButton: Locator;
  readonly allItems: Locator;
  readonly dynamicCatalog: Locator;
  readonly about: Locator;
  readonly logout: Locator;
  readonly reset: Locator;

  constructor(private readonly page: Page) {
    this.openButton = page.getByRole('button', { name: 'Open Menu' });
    this.allItems = page.getByTestId('inventory-sidebar-link');
    this.dynamicCatalog = page.getByTestId('dynamic-catalog-sidebar-link');
    this.about = page.getByTestId('about-sidebar-link');
    this.logout = page.getByTestId('logout-sidebar-link');
    this.reset = page.getByTestId('reset-sidebar-link');
  }

  async choose(item: Locator) {
    await this.openButton.click();
    await item.click();
  }

  async logOut() {
    await this.choose(this.logout);
  }

  async resetAppState() {
    await this.choose(this.reset);
  }

  async openDynamicPage(name: DynamicPage) {
    await this.openButton.click();
    await this.dynamicCatalog.click();
    await this.page.getByText(name, { exact: true }).click();
  }
}
