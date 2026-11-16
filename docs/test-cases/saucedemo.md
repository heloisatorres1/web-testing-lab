# Test cases: SauceDemo (SD)

SauceDemo has no published specification. The requirements below were derived from the [exploratory session](../exploration/2026-11-16-saucedemo-recon.md) and describe the behaviour of `standard_user`, which is treated as the reference. The other test users must behave the same way, except `locked_out_user`, which must not be able to log in.

Password for all users: `secret_sauce`. Priorities follow the [test plan](../test-plan.md#41-risk-based-priorities).

**Automation column:** `UI` = Playwright UI test, `BDD` = Gherkin scenario, `Manual` = kept manual on purpose (reason given).

## Derived requirements

| ID | Requirement |
| --- | --- |
| REQ-SD-01 | Users with valid credentials log in and land on **Products**. |
| REQ-SD-02 | Invalid, missing or locked credentials are refused with a specific error message. |
| REQ-SD-03 | Pages behind login cannot be opened without a session. |
| REQ-SD-04 | The catalog shows 6 products, each with its correct name, description, price and image. |
| REQ-SD-05 | Products can be sorted by name (A–Z, Z–A) and price (low–high, high–low). |
| REQ-SD-06 | Products can be added to and removed from the cart from the catalog, the product page and the cart. The badge shows the number of items. |
| REQ-SD-07 | Checkout requires first name, last name and postal code. |
| REQ-SD-08 | The overview shows item total, 8% tax rounded to the cent, and total = item total + tax. |
| REQ-SD-09 | Finishing checkout completes the order and empties the cart. |
| REQ-SD-10 | Logout ends the session, and the next user who logs in starts with an empty cart. Reset App State empties the cart. |
| REQ-SD-11 | Dynamic catalog pages (lazy load, spinner, slider) eventually show all their products. |
| REQ-SD-12 | Login, Products, cart and checkout pages load within 2 seconds for every user. (Dynamic catalog pages have intentional delays and are excluded.) |

## Authentication

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-001 | Login with valid user | 01 | P1 | Open login page → enter `standard_user` / `secret_sauce` → Login | **Products** page opens at `/inventory.html` | UI, BDD |
| TC-SD-002 | Login with every accepted user except locked | 01 | P1 | Repeat TC-SD-001 for `problem_user`, `performance_glitch_user`, `error_user`, `visual_user` | Each one reaches **Products** | UI (data-driven) |
| TC-SD-003 | Login with empty form | 02 | P2 | Click Login with both fields empty | `Epic sadface: Username is required` | UI, BDD (outline) |
| TC-SD-004 | Login without password | 02 | P2 | Enter username only → Login | `Epic sadface: Password is required` | UI, BDD (outline) |
| TC-SD-005 | Login with wrong password | 02 | P1 | `standard_user` / `wrong` → Login | `Epic sadface: Username and password do not match any user in this service` | UI, BDD (outline) |
| TC-SD-006 | Locked user cannot log in | 02 | P1 | `locked_out_user` / `secret_sauce` → Login | `Epic sadface: Sorry, this user has been locked out.` and stays on login | UI, BDD (outline) |
| TC-SD-007 | Error message can be dismissed | 02 | P3 | Cause any login error → click the ✕ on the message | Message and field error icons disappear | UI |
| TC-SD-008 | Protected page without session | 03 | P1 | Without logging in, open `/inventory.html`, `/cart.html`, `/checkout-step-one.html` | Redirect to login with `You can only access '<path>' when you are logged in.` | UI |
| TC-SD-009 | Logout ends the session | 10 | P1 | Log in → menu → Logout → browser Back | Login page; protected page is not shown again | UI |

## Catalog and sorting

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-010 | Catalog content matches reference | 04 | P1 | Log in → read every product's name and price | The 6 products and prices from the [reference table](../exploration/2026-11-16-saucedemo-recon.md#catalog-reference-data) | UI (data-driven per user) |
| TC-SD-011 | Every product has its own image | 04 | P2 | Log in → check each product image | 6 different images; none is the "404" placeholder; all load (natural width > 0) | UI (data-driven per user) |
| TC-SD-012 | Default sort is Name (A to Z) | 05 | P3 | Log in → read sort dropdown and list order | Dropdown shows **Name (A to Z)**, list is alphabetical | UI |
| TC-SD-013 | Sort by each option | 05 | P2 | Select each of the 4 sort options | List is ordered by the selected key and direction; no alert appears | UI, BDD (outline) |
| TC-SD-014 | Product details page | 04 | P2 | Click a product name | Detail page shows the same name, description and price as the list; Back to products returns to the list | UI |

## Cart

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-015 | Add one item | 06 | P1 | Add Backpack | Badge shows **1**; button changes to **Remove** | UI, BDD |
| TC-SD-016 | Add every item (boundary: all 6) | 06 | P1 | Add all 6 products | Badge shows **6**; cart lists all 6 | UI |
| TC-SD-017 | Remove from catalog | 06 | P2 | Add 2 items → Remove one from the catalog | Badge shows **1** | UI |
| TC-SD-018 | Remove from cart page (boundary: back to 0) | 06 | P2 | Add 1 item → open cart → Remove | Cart empty; badge hidden | UI |
| TC-SD-019 | Add from product detail page | 06 | P2 | Open a product → Add to cart | Badge increments; catalog shows **Remove** for that product | UI |
| TC-SD-020 | Cart survives reload | 06 | P2 | Add 2 items → reload page | Badge still **2** | UI |
| TC-SD-021 | Reset App State empties cart | 10 | P2 | Add 2 items → menu → Reset App State | Badge hidden; all buttons show **Add to cart** | UI |
| TC-SD-037 | Next user does not inherit the cart | 10 | P1 | `standard_user` adds Backpack + Onesie → Logout → log in as `visual_user` | Cart is empty for `visual_user` | UI, BDD |

## Checkout

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-022 | Complete purchase (happy path) | 07, 08, 09 | P1 | Add Backpack + Bike Light → Checkout → `Ana` / `Silva` / `86000` → Continue → Finish | Overview: item total $39.98, tax $3.20, total $43.18 → **Thank you for your order!**; badge hidden | UI, BDD |
| TC-SD-023 | Required fields (decision table) | 07 | P1 | Submit step one with each combination of empty fields | First missing field in order First → Last → Postal is reported: `Error: First Name is required`, `Error: Last Name is required`, `Error: Postal Code is required` | UI, BDD (outline) |
| TC-SD-024 | Typed values are kept in their own fields | 07 | P1 | Type into First, Last and Postal Code | Each field contains exactly what was typed into it | UI (data-driven per user) |
| TC-SD-025 | Tax and total math across carts | 08 | P1 | For carts {Onesie}, {Fleece Jacket}, {all 6}: go to overview | Tax = round(item total × 0.08, 2); total = item total + tax | UI (data-driven) |
| TC-SD-026 | Cancel from step one | 07 | P3 | Checkout → Cancel | Back to cart, items unchanged | UI |
| TC-SD-027 | Cancel from overview | 08 | P3 | Reach overview → Cancel | Back to Products, cart unchanged | UI |
| TC-SD-028 | Checkout with empty cart | 09 | P2 | Open cart with nothing in it → Checkout → fill form → Continue → Finish | **Open question:** today an order with no items completes with total $0.00. No requirement says this is wrong, so it is recorded as a question for the product owner, not a defect (see the [exploration notes](../exploration/2026-11-16-saucedemo-recon.md#risks-and-questions-raised)) | Manual (needs product decision) |
| TC-SD-029 | Long and special-character input | 07 | P3 | Enter 255 characters, accents (`João`), and `<script>` in the name fields | Values accepted and shown as plain text; no script runs | UI |

## Dynamic catalog

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-030 | Lazy load adds items on scroll | 11 | P2 | Menu → Dynamic Catalog → Lazy Load → note the item count → scroll to the end | More items appear; every loaded item has a name and a price; "Loading…" placeholders turn into items (infinite list: no fixed total) | UI |
| TC-SD-031 | Spinner page loads products | 11 | P2 | Menu → Dynamic Catalog → Spinner | 6 products appear with names and prices (observed delay ≈ 2.6 s) | UI |
| TC-SD-032 | Slider navigation and auto-advance | 11 | P3 | Menu → Dynamic Catalog → Slider → wait → then click each of the 6 dots | Slide changes on its own (≈ every 2 s); each dot shows a different product, 6 in total | UI |

## Non-functional

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-SD-033 | Login response time per user | 12 | P2 | Measure time from Login click to Products list visible | Under 2 s for every accepted user | UI (data-driven per user) |
| TC-SD-034 | Accessibility scan | — | P3 | Run axe on login, Products, cart and checkout pages | No critical or serious violations; any found are reported | UI (axe) |
| TC-SD-035 | Keyboard-only purchase | — | P3 | Complete TC-SD-022 using only Tab, Enter and Space | Purchase completes; focus is always visible | Manual (focus visibility needs human judgement) |
| TC-SD-036 | Mobile layout | — | P3 | Run TC-SD-022 at the Pixel 7 viewport | No horizontal scroll; all controls reachable | UI (mobile project) |

## Traceability summary

| Requirement | Test cases |
| --- | --- |
| REQ-SD-01 | 001, 002 |
| REQ-SD-02 | 003, 004, 005, 006, 007 |
| REQ-SD-03 | 008 |
| REQ-SD-04 | 010, 011, 014 |
| REQ-SD-05 | 012, 013 |
| REQ-SD-06 | 015 – 020 |
| REQ-SD-07 | 022, 023, 024, 026, 029 |
| REQ-SD-08 | 022, 025, 027 |
| REQ-SD-09 | 022, 028 |
| REQ-SD-10 | 009, 021, 037 |
| REQ-SD-11 | 030, 031, 032 |
| REQ-SD-12 | 033 |

## Expected results per special user

These are observations from exploration, to be confirmed with evidence when the cases run. Confirmed failures become bug reports. TC-SD-037 is expected to fail for **every** user, including `standard_user`.

| Case | `problem_user` | `error_user` | `performance_glitch_user` | `visual_user` |
| --- | --- | --- | --- | --- |
| TC-SD-010 Catalog content | — | — | — | **Fail** (prices differ) |
| TC-SD-011 Images | **Fail** (all placeholder) | — | — | **Fail** (backpack placeholder) |
| TC-SD-013 Sorting | **Fail** (no change) | **Fail** (alert, no change) | — | — |
| TC-SD-016 Add all 6 | **Fail** (Bolt T-Shirt, Fleece Jacket, Red T-Shirt not added) | **Fail** (same 3 items) | — | — |
| TC-SD-022 Purchase | **Fail** (blocked at step one) | **Fail** (Finish does nothing) | — | — |
| TC-SD-024 Fields keep input | **Fail** (Last Name writes into First Name) | **Fail** (Last Name ignores input) | — | — |
| TC-SD-033 Response time | — | — | **Fail** (≈ 5 s) | — |
