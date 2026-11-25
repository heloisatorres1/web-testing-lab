import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/qa-workspace/fixtures';

const PAGES: { route: string; heading: string | RegExp }[] = [
  { route: '', heading: 'Quality at a glance' },
  { route: 'capture', heading: 'Capture a finding' },
  { route: 'triage', heading: /Triage/ },
  { route: 'test-lab', heading: /Test Lab/ },
  { route: 'releases', heading: 'Release readiness' },
  { route: 'library', heading: /Library/ },
  { route: 'settings', heading: /Settings/ },
  { route: 'search', heading: /Search/ },
];

test.describe('Smoke', () => {
  for (const p of PAGES) {
    test(`TC-QW-001 ${p.route || 'overview'} opens cleanly @p1 @smoke`, async ({ page, ws, consoleErrors }) => {
      const failed: string[] = [];
      page.on('requestfailed', (r) => failed.push(r.url()));
      await ws.goto(p.route);
      await expect(ws.heading(p.heading).first()).toBeVisible();
      expect(consoleErrors, 'console errors').toEqual([]);
      expect(failed, 'failed requests').toEqual([]);
    });
  }

  test('TC-QW-002 unknown route shows a not-found page with a way back @p3', async ({ page, ws }) => {
    await ws.goto('does-not-exist');
    await expect(page.getByText(/not found|doesn.t exist|no page/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /overview|home|back/i }).first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  for (const route of ['', 'capture', 'triage', 'releases']) {
    test(`TC-QW-020 ${route || 'overview'} has no critical or serious violations @p2`, async ({ page, ws }) => {
      test.fail(true, 'BUG-011: text contrast below WCAG AA on every page (docs/bug-reports/BUG-011.md)');
      test.info().annotations.push({ type: 'issue', description: 'BUG-011' });
      await ws.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      await test.info().attach('axe.json', { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
      const serious = result.violations
        .filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s)`);
      expect(serious).toEqual([]);
    });
  }
});

test('TC-QW-018 narrow layout collapses navigation without horizontal scroll @p2 @mobile', async ({ page, ws }) => {
  await ws.goto('');
  await expect(page.getByRole('link', { name: 'Capture' })).not.toBeInViewport();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Capture' }).click();
  await expect(ws.heading('Capture a finding')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('TC-QW-019 Ctrl+K focuses search and Enter searches @p3', async ({ page, ws }) => {
  await ws.goto('');
  await page.keyboard.press('Control+k');
  const search = page.getByLabel(/^Search findings, cases, runs/);
  await expect(search).toBeFocused();
  await page.keyboard.type('CP-104');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Player gets stuck in greenhouse after reconnect')).toBeVisible();
});

test('TC-QW-017 theme follows the system and a manual choice survives reload @p3', async ({ page, ws }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ws.goto('');
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const dark = await background();
  await page.getByRole('button', { name: /^Theme: System/ }).click();
  await expect(page.getByRole('button', { name: /^Theme: Light/ })).toBeVisible();
  const light = await background();
  expect(light).not.toBe(dark);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Theme: Light/ })).toBeVisible();
  expect(await background()).toBe(light);
});
