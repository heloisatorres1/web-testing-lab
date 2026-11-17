# Test Plan: Web Testing Lab

| | |
| --- | --- |
| **Version** | 1.0 |
| **Status** | Approved for execution |
| **Author** | Heloisa Oller Torres |
| **Last updated** | 2026-11-16 |

## 1. Purpose

This plan describes how three web systems are tested: an online store UI, two public REST APIs, and a QA web application. It sets the scope, the approach, the tools, the entry and exit criteria, and the risks. Test cases are in [`docs/test-cases/`](test-cases/), and the exploratory session that informed this plan is in [`docs/exploration/`](exploration/).

## 2. Systems under test

| ID | System | Type | Why it was chosen |
| --- | --- | --- | --- |
| **SD** | [SauceDemo](https://www.saucedemo.com/) ("Swag Labs") | Web UI: login, catalog, cart, checkout | Industry-standard practice store. It ships special user accounts with **known defects**, so the suite has to detect real failures, not only pass. |
| **PS** | [Swagger Petstore](https://petstore.swagger.io/) | REST API with an OpenAPI (Swagger) spec | Testing against a published contract. Its data is **shared with everyone on the internet**, so tests have to create and clean up their own data. |
| **RB** | [Restful-Booker](https://restful-booker.herokuapp.com/apidoc/) | REST API with token auth | Authentication, full CRUD and partial updates. |
| **QW** | [QA Workspace](https://heloisatorres1.github.io/qa-workspace/) | Web app (React SPA, browser storage) | My own portfolio app, tested **black-box from a separate repo** against the deployed site, with its README as the specification. |

None of these systems has a formal requirements document. For SD, requirements were derived from an exploratory session (see the test cases), and for QW from its public README. Each test case links to the requirement it covers.

## 3. Scope

### In scope

- **SD:** authentication and session protection, product catalog and sorting, cart, the three-step checkout including price and tax calculation, side menu (logout, reset app state), dynamic-loading pages (lazy load, spinner, slider), and the behaviour of every special test user.
- **PS / RB:** CRUD operations, status codes, response schemas against the published contract, authentication, negative and boundary inputs.
- **QW:** finding capture with validation, triage rules, release decision rules, metric calculations, persistence and reset, responsive layout, theme, keyboard access, basic accessibility.
- **Cross-browser:** Chromium, Firefox and WebKit for the UI suites.

### Out of scope

| Item | Reason |
| --- | --- |
| Load and stress testing of public services | They are shared and free. Generating load against them would be abusive. Only single-request response time is observed. |
| Security / penetration testing | Not authorised on third-party systems. Only functional auth checks (missing or invalid credentials) are tested. |
| Real payments, emails, external links (sauce labs website, social links) | Not part of the systems under test. Links are checked for target only, not followed. |
| Pixel-perfect visual comparison | Third-party sites change their visuals without notice. `visual_user` defects are covered with targeted assertions instead. |
| Mobile native apps | Responsive web layouts are covered; native apps are not part of these systems. |

## 4. Approach

### 4.1 Risk-based priorities

Each test case has a priority derived from **impact × likelihood**:

| Priority | Meaning | Examples |
| --- | --- | --- |
| **P1** | Blocks the core business flow, or loses money or data | Cannot log in, wrong order total, checkout cannot finish |
| **P2** | Major feature wrong, workaround exists | Sorting wrong, item not removed from cart |
| **P3** | Minor or cosmetic | Wrong image, misaligned element |

Every push runs the full suite; `npm run test:smoke` runs only the P1 journeys for a quick local check. A nightly run catches changes in the public sites when nothing was pushed.

### 4.2 Test levels (test pyramid)

```
              ┌───────────────┐
              │  UI journeys   │   few, slow, high confidence (Playwright)
              ├───────────────┤
              │  BDD scenarios │   business-readable acceptance (Gherkin)
          ┌───┴───────────────┴───┐
          │       API tests        │   many, fast, precise (Postman + Playwright)
          └───────────────────────┘
```

A rule is checked at the lowest level where it can be checked. The browser is used for real user journeys and things that only exist in the UI.

### 4.3 Techniques

| Technique | Where it is used |
| --- | --- |
| Equivalence partitioning | Login users (valid, locked, invalid, empty), API payloads |
| Boundary value analysis | Cart quantity (0, 1, all 6 items), checkout fields (empty, one character, long input), API IDs |
| Decision tables | Checkout form validation, QW release decision (criticals open × risks accepted) |
| State transition | Cart badge across add, remove, reset, logout; QW finding status flow |
| Exploratory testing (session-based) | Initial discovery of SD, follow-ups on every defect found |
| Contract testing | API responses validated against the Swagger / documented schema |

### 4.4 Test types

Functional, negative, regression, cross-browser, responsive, basic accessibility (automated axe scan plus keyboard checks), and response-time observation. Response time is observed, not load-tested.

### 4.5 Test data

- **SD users** (password `secret_sauce`): `standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user`. These credentials are public and shown on the login page.
- **API data** is created by each test and deleted afterwards. Tests never depend on records created by other people.
- **QW** starts from its built-in fictional fixture data. Every test begins with a clean browser context, so tests never see each other's data.

## 5. Tools

| Purpose | Tool |
| --- | --- |
| UI and API automation | Playwright + TypeScript |
| BDD | Gherkin feature files run through `playwright-bdd` |
| Manual and exploratory API testing | Postman (collections and environments), run in CI with Newman |
| Accessibility | axe-core via `@axe-core/playwright` |
| Reporting | Playwright HTML report and Allure, published to GitHub Pages |
| CI/CD | GitHub Actions |
| Test management | Markdown test cases in this repo (versioned with the code they describe) |

## 6. Environments

| System | Environment | Notes |
| --- | --- | --- |
| SD, PS, RB | Public production instances | Not under my control. An outage stops the run at the health check and is treated as **blocked**, not as a product failure. |
| QW | GitHub Pages production build | Tests run after each deploy and nightly. |
| Browsers | Chromium, Firefox, WebKit (latest Playwright builds) | Desktop 1280×720 and mobile viewport (Pixel 7). |

## 7. Entry and exit criteria

**Entry**
- The system under test responds (health check passes).
- Test cases for the area have been reviewed.

**Exit (for a release of the suite)**
- 100% of P1 cases executed, and all pass on `standard_user` / happy paths.
- Every failure is either a reported defect with a bug report, or a fixed test.
- No flaky test: a test that fails then passes on retry is investigated, not ignored.
- Known defects in special SD users are **expected failures** (marked with `test.fail` and linked to the bug report), so the suite stays green while the defects stay visible.

## 8. Defect management

Defects are written in [`docs/bug-reports/`](bug-reports/) using one template: title, environment, severity, priority, preconditions, steps, expected, actual, evidence (screenshot or video), and notes. **Severity** (user impact) and **priority** (fix order) are rated separately.

| Severity | Definition |
| --- | --- |
| Critical | Core flow blocked or wrong money/data, no workaround |
| Major | Feature broken, workaround exists |
| Minor | Small functional issue |
| Trivial | Cosmetic |

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Public sites change or go down | False failures | CI checks that each site responds before the UI tests, so an outage fails with one clear message instead of a hundred test failures; selectors use stable `data-test` attributes |
| Shared Petstore data changed by other users | Flaky API tests | Unique IDs per run; create → verify → delete in every test; no reliance on existing records |
| Rate limiting on free APIs | Failed runs | Low request volume, no parallel load, retries only on network errors |
| Timing-dependent pages (spinner, lazy load, glitch user) | Flaky UI tests | Web-first assertions that wait for state; no fixed sleeps |
| Test passes for the wrong reason | Missed defects | Each automated test is first seen failing against a known-bad user or a broken assertion |

## 10. Deliverables

| Deliverable | Location |
| --- | --- |
| Test plan | This document |
| Test cases with traceability | [`docs/test-cases/`](test-cases/): [SauceDemo](test-cases/saucedemo.md), [APIs](test-cases/api.md), [QA Workspace](test-cases/qa-workspace.md) |
| Exploratory session notes | [`docs/exploration/`](exploration/) |
| Bug reports with evidence | [`docs/bug-reports/`](bug-reports/) |
| Automated suites (UI, API, BDD) | `tests/`, `postman/`, `features/` |
| CI pipeline and published reports | `.github/workflows/`, GitHub Pages |
| Test summary report | README "Results" section |
