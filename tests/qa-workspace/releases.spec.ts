import { test, expect, FIXTURE_RELEASE } from '../../src/qa-workspace/fixtures';

test.describe('Release decision', () => {
  test.beforeEach(async ({ ws }) => {
    await ws.goto(`releases/${FIXTURE_RELEASE}`);
  });

  test('TC-QW-010 Ready is unavailable while critical bugs are open @p1 @smoke', async ({ page }) => {
    await expect(page.getByText(/2 critical bugs unresolved/)).toBeVisible();
    await expect(page.getByRole('radio', { name: /^Ready Unavailable/ })).toBeDisabled();
    await expect(page.getByText('Unavailable while critical bugs are unresolved.')).toBeVisible();
  });

  test('TC-QW-012 a decision needs a rationale @p2', async ({ page }) => {
    await page.getByRole('radio', { name: /^Hold/ }).check();
    await page.getByLabel(/^Rationale/).fill('');
    await page.getByRole('button', { name: 'Save decision' }).click();
    await expect(page.getByText('Add a rationale so the decision can be understood later.')).toBeVisible();
  });

  test('TC-QW-011 an accepted risk needs a rationale and an owner @p1', async ({ page }) => {
    await page.getByRole('radio', { name: /^Ready with accepted risks/ }).check();
    await page.getByLabel(/^Rationale/).fill('Risks are known and owned.');
    await page.getByRole('button', { name: 'Save decision' }).click();
    await expect(page.getByText('List at least one accepted risk, or choose a different recommendation.')).toBeVisible();
  });

  test('TC-QW-013 a saved decision keeps its evidence after bugs change @p1', async ({ page, ws }) => {
    await expect(ws.chatPreview).toContainText('HOLD · Orbit Garden 0.8.4');
    await page.getByRole('button', { name: 'Save decision' }).click();
    await expect(page.getByText(/saved as revision 1/)).toBeVisible();

    await ws.goto('triage/CP-109');
    await page.getByRole('dialog').getByLabel('Status').selectOption('resolved');

    await ws.goto(`releases/${FIXTURE_RELEASE}`);
    await page.getByRole('tab', { name: 'Message' }).click();
    await expect(page.getByText(/Evidence has changed/)).toBeVisible();
    await expect(ws.chatPreview).toContainText('Blockers: CP-104, CP-109');
  });

  test('TC-QW-014 pass rate and execution rate follow the README formulas @p1', async ({ ws }) => {
    // The message states passed / applicable and both rates; the formulas must agree.
    const text = (await ws.chatPreview.textContent())!;
    const m = text.match(/(\d+) \/ (\d+) passed \(([\d.]+)% pass rate, ([\d.]+)% executed\)/);
    expect(m, `result line in: ${text}`).not.toBeNull();
    const [, passed, applicable, passRate, executionRate] = m!.map(Number);
    expect(passRate).toBe(Number(((passed / applicable) * 100).toFixed(1)));
    expect(executionRate).toBeGreaterThanOrEqual(passRate);
    expect(executionRate).toBeLessThanOrEqual(100);
  });
});
