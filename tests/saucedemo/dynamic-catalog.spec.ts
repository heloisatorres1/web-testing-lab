import { test, expect } from '../../src/saucedemo/fixtures';
import { PRODUCTS, USERS } from '../../src/saucedemo/data';

// These pages load content late on purpose. Every check below waits for a state
// (web-first assertions and expect.poll) instead of sleeping for a fixed time.
test.describe('Dynamic catalog', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs(USERS.standard);
  });

  test('TC-SD-030 lazy load adds items on scroll @p2', async ({ menu, dynamicCatalog }) => {
    await menu.openDynamicPage('Lazy Load');
    await expect(dynamicCatalog.lazyNames.first()).toBeVisible();
    const before = await dynamicCatalog.lazyNames.count();

    for (let batch = 1; batch <= 2; batch++) {
      const target = (await dynamicCatalog.lazyNames.count()) + 1;
      await dynamicCatalog.scrollToEnd();
      await expect
        .poll(() => dynamicCatalog.lazyNames.count(), { message: `batch ${batch} loads`, timeout: 10_000 })
        .toBeGreaterThanOrEqual(target);
    }
    expect(await dynamicCatalog.lazyNames.count()).toBeGreaterThan(before);

    const names = await dynamicCatalog.lazyNames.allTextContents();
    const prices = await dynamicCatalog.lazyPrices.allTextContents();
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
    expect(prices.every((p) => /^\$\d+\.\d{2}$/.test(p))).toBe(true);
  });

  test('TC-SD-031 spinner page shows 6 products @p2', async ({ menu, dynamicCatalog }) => {
    await menu.openDynamicPage('Spinner');
    await expect(dynamicCatalog.spinnerNames).toHaveCount(PRODUCTS.length, { timeout: 10_000 });
    expect((await dynamicCatalog.spinnerNames.allTextContents()).sort()).toEqual(PRODUCTS.map((p) => p.name).sort());
    await expect(dynamicCatalog.spinnerPrices).toHaveCount(PRODUCTS.length);
  });

  test('TC-SD-032 slider advances by itself and every dot shows a product @p3', async ({ menu, dynamicCatalog }) => {
    await menu.openDynamicPage('Slider');
    const first = await dynamicCatalog.sliderName.textContent();
    await expect(dynamicCatalog.sliderName, 'slide changes on its own').not.toHaveText(first!, { timeout: 6_000 });

    const seen = new Set<string>();
    for (let i = 0; i < PRODUCTS.length; i++) {
      await dynamicCatalog.sliderDot(i).click();
      seen.add((await dynamicCatalog.sliderName.textContent())!);
    }
    expect([...seen].sort()).toEqual(PRODUCTS.map((p) => p.name).sort());
  });
});
