import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const CI = !!process.env.CI;

const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['features/steps/**/*.ts'],
  outputDir: '.features-gen',
});

const uiSpecs = ['saucedemo/**/*.spec.ts', 'qa-workspace/**/*.spec.ts'];

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: CI,
  // One retry in CI separates "flaky" from "broken"; flaky results are still reported.
  retries: CI ? 1 : 0,
  workers: CI ? 4 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }],
    ...(CI ? ([['github']] as const) : []),
  ],
  use: {
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
    },
    {
      name: 'chromium',
      testMatch: uiSpecs,
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: uiSpecs,
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: uiSpecs,
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      testMatch: uiSpecs,
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
