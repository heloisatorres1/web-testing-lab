import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import type { BugDraft } from '../../src/qa-workspace/fixtures';

Given('I open the QA Workspace release {string}', async ({ ws }, release: string) => {
  await ws.goto(`releases/${release}`);
});

Then('the release shows {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then('the {string} recommendation is disabled with {string}', async ({ page }, option: string, reason: string) => {
  await expect(page.getByRole('radio', { name: new RegExp(`^${option} ${reason.slice(0, 11)}`) })).toBeDisabled();
  await expect(page.getByText(reason)).toBeVisible();
});

When('I choose the {string} recommendation', async ({ page }, option: string) => {
  await page.getByRole('radio', { name: new RegExp(`^${option}`) }).check();
});

When('I write the rationale {string}', async ({ page }, rationale: string) => {
  await page.getByLabel(/^Rationale/).fill(rationale);
});

When('I save the decision', async ({ page }) => {
  await page.getByRole('button', { name: 'Save decision' }).click();
});

Then('saving is refused because an accepted risk is missing', async ({ page }) => {
  await expect(page.getByText('List at least one accepted risk, or choose a different recommendation.')).toBeVisible();
});

Given('I open the QA Workspace capture page for a {string}', async ({ ws }, type: string) => {
  await ws.goto('capture');
  await ws.chooseFindingType(type as 'Bug' | 'Feedback' | 'Question');
});

When('I try to submit the finding', async ({ ws, page }) => {
  await ws.reviewAndSubmit();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

Then('the fields {string} are marked invalid', async ({ ws }, list: string) => {
  for (const label of list.split(',').map((s) => s.trim())) {
    await expect(ws.field(new RegExp(`^${label}`)), `${label} is marked invalid`).toHaveAttribute('aria-invalid', 'true');
  }
});

When('I fill a bug titled {string} with severity {string} and priority {string}', async ({ ws }, title: string, severity: string, priority: string) => {
  await ws.fillBug({ title: `${title} ${Date.now()}`, severity: severity as BugDraft['severity'], priority: priority as BugDraft['priority'] });
});

When('I submit the finding', async ({ ws }) => {
  const id = await ws.submitFinding();
  ws.page.context().setDefaultTimeout(10_000);
  (ws as unknown as { lastId: string }).lastId = id;
});

Then('the finding appears in Triage with severity {string} and priority {string}', async ({ ws, page }, severity: string, priority: string) => {
  const id = (ws as unknown as { lastId: string }).lastId;
  await ws.goto(`triage/${id}`);
  const details = page.getByRole('dialog');
  await expect(details).toContainText(new RegExp(severity));
  await expect(details).toContainText(priority);
});
