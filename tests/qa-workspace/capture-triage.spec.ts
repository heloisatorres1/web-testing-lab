import { test, expect } from '../../src/qa-workspace/fixtures';

test.describe('Capture', () => {
  test.beforeEach(async ({ ws }) => {
    await ws.goto('capture');
  });

  test('TC-QW-003 bug: required fields are reported inline @p1 @smoke', async ({ page, ws }) => {
    await ws.chooseFindingType('Bug');
    await ws.reviewAndSubmit();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    for (const label of [/^Title/, /^Severity/, /^Priority/, /^Steps to reproduce/, /^Expected result/, /^Actual result/]) {
      await expect(ws.field(label), `${label} is marked invalid`).toHaveAttribute('aria-invalid', 'true');
    }
  });

  test('TC-QW-005 feedback: required fields are reported inline @p2', async ({ page, ws }) => {
    await ws.chooseFindingType('Feedback');
    await ws.reviewAndSubmit();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(ws.field(/^Title/)).toHaveAttribute('aria-invalid', 'true');
    await expect(ws.field(/^Observation/)).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-QW-006 question: required fields are reported inline @p2', async ({ page, ws }) => {
    await ws.chooseFindingType('Question');
    await ws.reviewAndSubmit();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(ws.field(/^Title/)).toHaveAttribute('aria-invalid', 'true');
    await expect(ws.field(/^Who should answer/)).toHaveAttribute('aria-invalid', 'true');
    await expect(ws.field(/^Question/)).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-QW-004 + 007 low severity with P1 priority is stored as given and shows in Triage @p1', async ({ page, ws }) => {
    const title = `Low severity, urgent fix ${Date.now()}`;
    await ws.chooseFindingType('Bug');
    await ws.fillBug({ title, severity: 'low', priority: 'P1' });
    const id = await ws.submitFinding();

    await ws.goto(`triage/${id}`);
    const details = page.getByRole('dialog');
    await expect(details).toContainText(title);
    await expect(details).toContainText(/Low/);
    await expect(details).toContainText(/P1/);
  });

  test('TC-QW-015 + 016 a captured bug survives reload and disappears on Reset demo @p2', async ({ page, ws }) => {
    const title = `Persistence check ${Date.now()}`;
    await ws.chooseFindingType('Bug');
    await ws.fillBug({ title, severity: 'medium', priority: 'P3' });
    const id = await ws.submitFinding();

    await page.reload();
    await ws.goto(`triage/${id}`);
    await expect(page.getByRole('dialog')).toContainText(title);

    await ws.resetDemo();
    await ws.goto('triage');
    await page.getByPlaceholder('Search by ID or text').fill(title);
    await expect(page.getByText(title)).toHaveCount(0);
  });
});

test.describe('Triage', () => {
  test('TC-QW-008 filters combine and clear @p2', async ({ page, ws }) => {
    await ws.goto('triage');
    const rows = page.getByRole('link', { name: /CP-\d+/ });
    const all = await rows.count();
    expect(all).toBeGreaterThan(0);

    await page.getByLabel(/^Severity/).selectOption('critical');
    await expect.poll(() => rows.count()).toBeLessThan(all);
    const criticalOnly = await rows.count();
    expect(criticalOnly).toBeGreaterThan(0);

    const filters = page.getByRole('group', { name: 'Filters' });
    await filters.getByLabel(/^Build/).selectOption({ index: 1 });
    await expect.poll(() => rows.count()).toBeLessThanOrEqual(criticalOnly);

    await page.getByLabel(/^Severity/).selectOption('');
    await filters.getByLabel(/^Build/).selectOption('');
    await expect.poll(() => rows.count()).toBe(all);
  });

  test('TC-QW-009 a question converts to a linked bug only on purpose @p2', async ({ page, ws }) => {
    await ws.goto('triage');
    await page.getByLabel(/^Type/).selectOption('question');
    // The filter is applied through the URL; wait for it so the first row is really a question
    // (WebKit read the list before the filter had been applied).
    await expect(page).toHaveURL(/type=question/);
    await page.getByRole('link', { name: /CP-\d+/ }).first().click();
    // The ID comes from the URL of the opened finding, never from a row that may have re-rendered.
    await expect(page).toHaveURL(/triage\/CP-\d+/);
    const questionId = page.url().match(/CP-\d+/)![0];
    const details = page.getByRole('dialog');
    await expect(details).toContainText(/Question/);
    await details.getByRole('button', { name: /Convert to bug/ }).click();

    await expect(page).toHaveURL(/#\/capture/);
    await expect(page.getByText(new RegExp(questionId)).first()).toBeVisible();

    await ws.goto(`triage/${questionId}`);
    await expect(page.getByRole('dialog')).toContainText(questionId);
  });
});
