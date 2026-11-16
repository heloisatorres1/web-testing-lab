import { mergeTests } from '@playwright/test';
import { test as bddBase, createBdd } from 'playwright-bdd';
import { test as shopTest } from '../../src/saucedemo/fixtures';
import { test as workspaceTest } from '../../src/qa-workspace/fixtures';

/** One test object with the BDD runtime and the page objects of both systems, so steps can use them as fixtures. */
export const test = mergeTests(bddBase, shopTest, workspaceTest);

export const { Given, When, Then } = createBdd(test);
