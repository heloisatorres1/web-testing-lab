import { test, expect } from '../../src/saucedemo/fixtures';
import { ACCEPTED_USERS, PRODUCTS, USERS } from '../../src/saucedemo/data';
import { expectKnownDefect } from '../../src/saucedemo/known-defects';
import type { SortOption } from '../../src/saucedemo/pages/InventoryPage';

test.describe('Catalog', () => {
  for (const user of ACCEPTED_USERS) {
    test.describe(user, () => {
      test.beforeEach(async ({ loginAs }) => {
        await loginAs(user);
      });

      test(`TC-SD-010 catalog matches reference @p1`, async ({ inventory }) => {
        expectKnownDefect('TC-SD-010', user);
        expect(await inventory.names()).toEqual(PRODUCTS.map((p) => p.name));
        expect(await inventory.prices()).toEqual(PRODUCTS.map((p) => p.price));
      });

      test(`TC-SD-011 every product has its own image @p2`, async ({ inventory }) => {
        expectKnownDefect('TC-SD-011', user);
        const sources = await inventory.imageSources();
        expect(sources).toHaveLength(PRODUCTS.length);
        expect(sources.filter((src) => /404/.test(src)), 'placeholder images').toEqual([]);
        expect(new Set(sources).size, 'distinct images').toBe(PRODUCTS.length);
        const loaded = await inventory.itemImages.evaluateAll((imgs) =>
          imgs.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0),
        );
        expect(loaded, 'all images load').toBe(true);
      });

      const sorts: { option: SortOption; label: string; key: 'name' | 'price'; dir: 1 | -1 }[] = [
        { option: 'az', label: 'Name (A to Z)', key: 'name', dir: 1 },
        { option: 'za', label: 'Name (Z to A)', key: 'name', dir: -1 },
        { option: 'lohi', label: 'Price (low to high)', key: 'price', dir: 1 },
        { option: 'hilo', label: 'Price (high to low)', key: 'price', dir: -1 },
      ];
      // Sorting A to Z is also the default order, so a broken sort only shows on the other options.
      for (const s of sorts.filter((x) => x.option !== 'az')) {
        test(`TC-SD-013 sort by ${s.label} @p2`, async ({ page, inventory }) => {
          expectKnownDefect(s.key === 'price' ? 'TC-SD-013/price' : 'TC-SD-013', user);
          const dialogs: string[] = [];
          page.on('dialog', (d) => {
            dialogs.push(d.message());
            void d.dismiss();
          });
          await inventory.sortBy(s.option);
          if (s.key === 'name') {
            const expected = PRODUCTS.map((p) => p.name).sort((a, b) => a.localeCompare(b) * s.dir);
            await expect(inventory.itemNames).toHaveText(expected);
          } else {
            const prices = await inventory.prices();
            const sorted = [...prices].sort((a, b) => (a - b) * s.dir);
            expect(prices).toEqual(sorted);
            expect(prices).not.toEqual(PRODUCTS.map((p) => p.price));
          }
          expect(dialogs, 'no error dialogs').toEqual([]);
        });
      }
    });
  }

  test('TC-SD-012 default sort is Name (A to Z) @p3', async ({ loginAs, inventory }) => {
    await loginAs(USERS.standard);
    await expect(inventory.sort).toHaveValue('az');
    const names = await inventory.names();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('TC-SD-014 product detail matches the list @p2', async ({ loginAs, inventory, productPage, page }) => {
    await loginAs(USERS.standard);
    for (const p of PRODUCTS) {
      await expect(inventory.items).toHaveCount(PRODUCTS.length);
      const card = inventory.items.filter({ hasText: p.name });
      const description = await card.getByTestId('inventory-item-desc').textContent();
      await inventory.openProduct(p);
      await expect(page).toHaveURL(/inventory-item\.html/);
      await expect(productPage.name).toHaveText(p.name);
      await expect(productPage.description).toHaveText(description!);
      await expect(productPage.price).toHaveText(`$${p.price}`);
      await productPage.backButton.click();
      await expect(page).toHaveURL(/inventory\.html$/);
    }
  });
});
