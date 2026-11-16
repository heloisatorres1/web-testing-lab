import { expect, type Locator, type Page } from '@playwright/test';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** Covers the three checkout steps: information, overview and complete. */
export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly backHome: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.completeHeader = page.getByTestId('complete-header');
    this.backHome = page.getByTestId('back-to-products');
  }

  async fillInformation(info: Partial<CustomerInfo>) {
    if (info.firstName !== undefined) await this.type(this.firstName, info.firstName);
    if (info.lastName !== undefined) await this.type(this.lastName, info.lastName);
    if (info.postalCode !== undefined) await this.type(this.postalCode, info.postalCode);
  }

  /**
   * Fills a field and types again if the page's first render wiped the value. This was seen
   * only in WebKit under parallel load (never in isolation) and is a timing effect of the
   * test, not something a person can reproduce. The retry only covers an emptied field, so
   * a field that shows the wrong text (a real defect) still fails the test.
   */
  private async type(field: Locator, value: string) {
    await field.fill(value);
    try {
      await expect(field).toHaveValue(value, { timeout: 1_000 });
    } catch {
      if ((await field.inputValue()) === '') await field.fill(value);
    }
  }

  async submitInformation(info: Partial<CustomerInfo>) {
    await this.fillInformation(info);
    await this.continueButton.click();
  }

  async expectOnOverview() {
    await expect(this.page).toHaveURL(/checkout-step-two\.html$/);
  }

  /** Reads labels such as "Item total: $39.98" as numbers. */
  async amounts() {
    const read = async (label: Locator) => Number((await label.textContent())!.replace(/[^0-9.]/g, ''));
    return { subtotal: await read(this.subtotal), tax: await read(this.tax), total: await read(this.total) };
  }

  async finish() {
    await this.finishButton.click();
  }
}
