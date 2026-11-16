import { test } from '@playwright/test';
import type { Username } from './data';

/**
 * Confirmed defects, per test case and per user. A test that hits one of these is marked
 * as an expected failure and linked to its bug report. If the defect is ever fixed, the
 * test passes unexpectedly and the run fails, which tells us to close the bug and
 * remove the entry.
 */
export const BUGS = {
  'BUG-001': 'Cart is not cleared on logout and is shown to the next user',
  'BUG-002': 'Product images replaced by a "not found" placeholder',
  'BUG-003': 'Add to cart does nothing for three products',
  'BUG-004': 'Typing in Last Name overwrites First Name, so checkout is blocked',
  'BUG-005': 'Last Name field ignores input but checkout continues without it',
  'BUG-006': 'Finish does nothing, so the order never completes',
  'BUG-007': 'Sorting does not reorder the product list',
  'BUG-008': 'Catalog shows wrong prices that change on every page load',
  'BUG-009': 'Login takes about 5 seconds',
} as const;

export type BugId = keyof typeof BUGS;

type CaseId =
  | 'TC-SD-010'
  | 'TC-SD-011'
  | 'TC-SD-013'
  | 'TC-SD-013/price'
  | 'TC-SD-016'
  | 'TC-SD-022'
  | 'TC-SD-024'
  | 'TC-SD-033'
  | 'TC-SD-037';

const KNOWN: Record<CaseId, Partial<Record<Username | '*', BugId>>> = {
  'TC-SD-010': { visual_user: 'BUG-008' },
  'TC-SD-011': { problem_user: 'BUG-002', visual_user: 'BUG-002' },
  'TC-SD-013': { problem_user: 'BUG-007', error_user: 'BUG-007' },
  // visual_user sorts the real prices but displays random ones, so price order looks wrong.
  'TC-SD-013/price': { problem_user: 'BUG-007', error_user: 'BUG-007', visual_user: 'BUG-008' },
  'TC-SD-016': { problem_user: 'BUG-003', error_user: 'BUG-003' },
  'TC-SD-022': { problem_user: 'BUG-004', error_user: 'BUG-006' },
  'TC-SD-024': { problem_user: 'BUG-004', error_user: 'BUG-005' },
  'TC-SD-033': { performance_glitch_user: 'BUG-009' },
  'TC-SD-037': { '*': 'BUG-001' },
};

export function bugFor(caseId: CaseId, user: Username): BugId | undefined {
  return KNOWN[caseId][user] ?? KNOWN[caseId]['*'];
}

/** Call at the start of a test: marks it as an expected failure when a known defect applies. */
export function expectKnownDefect(caseId: CaseId, user: Username) {
  const bug = bugFor(caseId, user);
  if (!bug) return;
  test.info().annotations.push({ type: 'issue', description: `${bug}: ${BUGS[bug]} (docs/bug-reports/${bug}.md)` });
  test.fail(true, `${bug}: ${BUGS[bug]}`);
}
