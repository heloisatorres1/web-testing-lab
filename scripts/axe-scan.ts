/**
 * Prints the accessibility violations axe finds on one or more URLs, grouped by rule.
 * Run with: npm run axe -- https://example.com/page
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

async function main() {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error('Usage: npm run axe -- <url> [url...]');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  for (const url of urls) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    console.log(`\n${url}: ${violations.length} rule(s) violated`);
    for (const v of violations) {
      console.log(`  ${v.id} [${v.impact}] ${v.help} (${v.nodes.length} element(s))`);
      for (const n of v.nodes.slice(0, 4)) console.log(`    - ${n.target.join(' ')}: ${n.any[0]?.message ?? ''}`);
    }
  }
  await browser.close();
}

void main();
