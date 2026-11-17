import { test as base, expect, type Locator, type Page } from '@playwright/test';

export const QA_WORKSPACE_URL = 'https://heloisatorres1.github.io/qa-workspace/';

export const FIXTURE_RELEASE = 'rel-084';

export interface BugDraft {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
}

/** Black-box driver for the deployed QA Workspace. Only public labels and routes are used. */
export class Workspace {
  /** ID of the last finding submitted through this driver (used by BDD steps). */
  lastFindingId?: string;

  constructor(readonly page: Page) {}

  async goto(route: string) {
    await this.page.goto(`${QA_WORKSPACE_URL}#/${route.replace(/^\//, '')}`);
  }

  heading(name: string | RegExp) {
    return this.page.getByRole('heading', { name });
  }

  field(label: RegExp) {
    return this.page.getByLabel(label);
  }

  async chooseFindingType(type: 'Bug' | 'Feedback' | 'Question') {
    await this.page.getByRole('tab', { name: type }).click();
  }

  async reviewAndSubmit() {
    await this.page.getByRole('button', { name: 'Review & submit' }).click();
  }

  async fillBug(draft: BugDraft) {
    await this.field(/^Title/).fill(draft.title);
    await this.field(/^Severity/).selectOption(draft.severity);
    await this.field(/^Priority/).selectOption(draft.priority);
    await this.field(/^Steps to reproduce/).fill('1. Open the greenhouse.\n2. Lose the connection.\n3. Reconnect.');
    await this.field(/^Expected result/).fill('The greenhouse stays open.');
    await this.field(/^Actual result/).fill('The greenhouse closes.');
  }

  /** Submits the composer and returns the new finding's ID (for example CP-131). */
  async submitFinding(): Promise<string> {
    await this.reviewAndSubmit();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    const heading = this.page.getByRole('heading', { name: /CP-\d+ saved/ });
    await expect(heading).toBeVisible();
    this.lastFindingId = (await heading.textContent())!.match(/CP-\d+/)![0];
    return this.lastFindingId;
  }

  async resetDemo() {
    await this.goto('settings');
    await this.page.getByRole('button', { name: 'Reset demo' }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Reset' }).click();
  }

  /** The chat-style preview block shown on Capture and Releases. */
  get chatPreview(): Locator {
    return this.page.locator('.chat-msg');
  }
}

export const test = base.extend<{ ws: Workspace; consoleErrors: string[] }>({
  ws: async ({ page }, use) => use(new Workspace(page)),
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    await use(errors);
  },
});

export { expect };
