import { expect, type Locator, type Page } from '@playwright/test';
import { PASSWORD, SAUCEDEMO_URL } from '../data';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly errorClose: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.error = page.getByTestId('error');
    this.errorClose = page.getByTestId('error-button');
  }

  async open() {
    await this.page.goto(`${SAUCEDEMO_URL}/`);
  }

  async login(username: string, password: string = PASSWORD) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.error).toHaveText(message);
  }
}
