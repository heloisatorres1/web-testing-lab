# Web Testing Lab

A QA portfolio project that tests four public web systems end to end: a store's UI, two REST APIs and a QA web application. It covers the things a web QA role asks for in one place: a test strategy, exploratory testing, test cases with traceability, UI automation with Playwright, API testing with Postman and Playwright, BDD scenarios in Gherkin, bug reports with evidence, and a CI pipeline that publishes the report.

[![Tests](https://github.com/heloisatorres1/web-testing-lab/actions/workflows/tests.yml/badge.svg)](https://github.com/heloisatorres1/web-testing-lab/actions/workflows/tests.yml) · **[Project page](https://heloisatorres1.github.io/web-testing-lab/)** (a guided tour of the project) · **[Allure report](https://heloisatorres1.github.io/web-testing-lab/report/)** (published by CI)

> **Red ✘ marks in the CI log are on purpose.** About 70 tests check bugs that are already reported and still open. They are expected to fail, and a run counts as green while they do. A run only turns red for a new problem, or when a known bug gets fixed. See [How known defects are handled](#how-known-defects-are-handled).

## Systems under test

| System | What it is | Why it is here |
| --- | --- | --- |
| [SauceDemo](https://www.saucedemo.com/) | Practice online store | Login, catalog, cart, checkout. Its special test users ship with **known defects**, so the suite has to detect real failures, not only pass. |
| [Swagger Petstore](https://petstore.swagger.io/) | REST API with an OpenAPI (Swagger) spec | Contract testing. Its data is shared with everyone, so each test creates and deletes its own. |
| [Restful-Booker](https://restful-booker.herokuapp.com/apidoc/) | REST API with token auth | Authentication, CRUD, partial updates. |
| [QA Workspace](https://heloisatorres1.github.io/qa-workspace/) | My own QA web app | Black-box acceptance testing of a deployed app from a separate repo, with its README as the specification. |

## What the tests found

11 defects, each with a bug report and evidence in [`docs/bug-reports/`](docs/bug-reports/). Highlights:

- **[BUG-001](docs/bug-reports/BUG-001.md) SauceDemo keeps the cart after logout and shows it to the next user.** This is not one of the site's deliberately broken test users: it happens with the reference `standard_user`.
- **[BUG-008](docs/bug-reports/BUG-008.md)** `visual_user` sees random prices while the cart charges the real ones.
- **[BUG-010](docs/bug-reports/BUG-010.md)** Petstore stores pets that break its own Swagger contract, so listings contain pets without a name.
- **[BUG-011](docs/bug-reports/BUG-011.md)** My own QA Workspace fails the WCAG AA contrast ratio on every page (found by an axe scan its own test suite does not run).

Two things were deliberately logged as **questions for the product owner, not bugs**, because no requirement says they are wrong: SauceDemo completes an order with an empty cart ($0.00), and Restful-Booker accepts a checkout date before the checkin date.

## How known defects are handled

The tests are not changed to pass around a bug. A test that finds a confirmed bug keeps checking the correct behaviour, and is marked as an **expected failure** with the bug ID:

- SauceDemo bugs are mapped in [`src/saucedemo/known-defects.ts`](src/saucedemo/known-defects.ts) to the test case and user they affect.
- Other bugs (BUG-010, BUG-011) are marked in the test itself with `test.fail()` and a link to the bug report.
- In the Gherkin scenarios, the `@fail` tag does the same job (BUG-001).

What this means when you read a run:

| You see | Meaning | Run result |
| --- | --- | --- |
| ✘ on a test marked with a bug ID | The known bug is still there | Green |
| A test marked with a bug ID suddenly passes | The bug was fixed: time to retest and close it | Red |
| ✘ on any other test | A new problem: a bug in the system, or a test that needs updating | Red |

So the defects stay visible in the report without hiding new failures, and nothing is skipped.

## Results

Latest full local run (`npm test`, 2026-11-16, 2.9 minutes with 4 workers):

| Project | Tests | Passed | Expected failures (known bugs) |
| --- | ---: | ---: | ---: |
| `api` (Petstore + Restful-Booker) | 22 | 21 | 1 (BUG-010) |
| `chromium` (SauceDemo + QA Workspace) | 112 | 89 | 23 |
| `firefox` | 112 | 89 | 23 |
| `webkit` | 112 | 89 | 23 |
| `mobile` (Pixel 7) | 2 | 2 | 0 |
| `bdd` (Gherkin scenarios) | 19 | 18 | 1 (BUG-001) |
| **Total** | **379** | **308** | **71** |

Postman through Newman: Restful-Booker 12 requests / 16 assertions, Petstore 9 requests / 13 assertions, all passing.

The 23 expected failures per browser are the 9 SauceDemo defects across the users they affect (BUG-001 to BUG-009) plus the 4 axe scans of QA Workspace (BUG-011). The first full run also had one real failure, a timing race in a WebKit test that read a list row before a filter had re-rendered it; it was fixed in the test (see the comment in `tests/qa-workspace/capture-triage.spec.ts`) and repeated 5 times in three browsers without failing.

Every failure in a run is either a known defect (expected failure) or a real finding. The suite has no "flaky but ignored" tests: the one timing problem found (see Lessons learned) was fixed at the page-object level with a documented reason.

## Repository map

| Path | Contents |
| --- | --- |
| [`docs/test-plan.md`](docs/test-plan.md) | Scope, risk-based priorities, test pyramid, techniques, environments, entry/exit criteria, risks |
| [`docs/exploration/`](docs/exploration/) | Session-based exploratory testing notes that the test cases were derived from |
| [`docs/test-cases/`](docs/test-cases/) | Test cases for [SauceDemo](docs/test-cases/saucedemo.md), the [APIs](docs/test-cases/api.md) and [QA Workspace](docs/test-cases/qa-workspace.md), each with a requirement traceability table |
| [`docs/bug-reports/`](docs/bug-reports/) | BUG-001 to BUG-011 with screenshots captured by [`scripts/capture-evidence.ts`](scripts/capture-evidence.ts) |
| [`src/saucedemo/`](src/saucedemo/) | Page objects, reference data, fixtures and the known-defect map |
| [`src/qa-workspace/`](src/qa-workspace/), [`src/api/`](src/api/) | Black-box driver for QA Workspace; API clients and the Ajv contract validator |
| [`tests/`](tests/) | Playwright specs: `saucedemo/`, `qa-workspace/`, `api/` |
| [`features/`](features/) | Gherkin feature files and step definitions (run through `playwright-bdd`) |
| [`postman/`](postman/) | Postman collections and environment, run by Newman |
| [`site/`](site/) | The project page deployed at the root of the GitHub Pages site, next to the Allure report |
| [`.github/workflows/tests.yml`](.github/workflows/tests.yml) | CI: typecheck → API + Newman → UI matrix (Chromium, Firefox, WebKit, mobile, BDD) → Allure report to GitHub Pages |

## Strategy in short

- **Risk first.** Cases are P1/P2/P3 by impact × likelihood; `@smoke` runs the P1 journeys only (`npm run test:smoke`).
- **Lowest level that can check the rule.** API rules are checked with API tests; the browser is for user journeys and UI-only behaviour.
- **Data-driven by user.** Catalog, cart, checkout and response-time cases run once per SauceDemo user, so one spec covers the six accounts and their differences.
- **No fixed sleeps.** Dynamic pages (lazy load, spinner, auto-advancing slider) are tested with web-first assertions and `expect.poll`.
- **Own your data.** API tests create unique records and clean up; nothing depends on data other people leave on the shared services.
- **Accessibility as a gate.** axe scans (WCAG 2 A/AA) fail on critical and serious violations; the full list is attached to each run.
- **Severity ≠ priority** in every bug report.

The full plan is in [docs/test-plan.md](docs/test-plan.md).

## Run it

```bash
npm install
npx playwright install        # browsers

npm test                      # everything: api, chromium, firefox, webkit, mobile, bdd
npm run test:smoke            # P1 journeys in Chromium + API
npm run test:api              # Playwright API tests
npm run test:postman          # Postman collections through Newman (HTML report in newman-report/)
npm run test:bdd              # Gherkin scenarios
npm run report                # open the Playwright HTML report
npm run report:allure         # build the Allure report into allure-report/

npm run evidence              # re-capture the bug screenshots
npm run axe -- <url>          # print axe violations for any page
```

Playwright's `--reporter` flag replaces the reporters in the config, so run without it when you want Allure results.

## Lessons learned

- **Verify before you write the case.** Three assumptions from the first exploration were wrong (the lazy-load list is infinite, the slider auto-advances, an empty cart can be ordered). Scripting a second look before writing cases saved rewriting them later.
- **A question is not a bug.** Behaviour that no requirement forbids goes to the product owner as a question. Mixing the two makes bug lists untrustworthy.
- **Flaky ≠ broken, but both need a cause.** WebKit under parallel load sometimes wiped a field that had just been typed into, something a person cannot reproduce. The fix is a verified fill in the page object with a comment explaining why, not a retry on the test.
- **Shared test services are a test design problem.** Petstore returned other people's malformed pets and failed a contract check that was never about my data. The contract check now applies to the record the test created, and the server's acceptance of bad data became its own bug. Later, a check that searched for a made-up status ("flying") failed because someone else had saved a pet with that exact status; it now uses a value unique to each run.
- **Expected failures beat skipped tests.** `test.fail()` keeps the defect in the report and tells you the moment it gets fixed; `test.skip()` hides it.
- **The nightly run earns its keep.** On 2026-11-24 the scheduled run failed in every browser: I had added a feature to QA Workspace and the search box label gained a word. Nobody had pushed to this repo, so only the nightly check caught it. The app worked, so this was a test to update, not a bug. The test now matches the stable start of the label rather than the whole sentence, while the expected-failure tests were left as they are.
- **Tool details matter in CI.** Postman's validator rejects Swagger's `int64` format, and Playwright's `--reporter` flag silently drops the Allure reporter. Both are documented where they bite.

## Tools

Playwright · TypeScript · Postman / Newman · Gherkin via `playwright-bdd` · axe-core · Ajv · Allure 3 · GitHub Actions

## Author

Heloisa Oller Torres, QA Test Lead. [LinkedIn](https://www.linkedin.com/in/heloisa-torres-94250814a)
