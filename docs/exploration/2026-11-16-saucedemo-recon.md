# Exploratory session: SauceDemo first look

| | |
| --- | --- |
| **Charter** | Explore SauceDemo with every published test user to learn the product, derive requirements, and find areas of risk before writing test cases. |
| **Date** | 2026-11-16 |
| **Duration** | 45 min |
| **Environment** | https://www.saucedemo.com/, Microsoft Edge (Chromium), Windows 11, 1280×720 |
| **Tester** | Heloisa Oller Torres |

## What the product does

- Login page lists six accepted usernames. All use the password `secret_sauce`.
- **Products** page: 6 items, sort by Name (A to Z / Z to A) and Price (low to high / high to low), "Add to cart" per item, cart icon with a count badge.
- **Cart** → **Checkout: Your Information** (first name, last name, postal code) → **Checkout: Overview** (item total, tax, total) → **Checkout: Complete**.
- **Side menu:** All Items, Dynamic Catalog (Lazy Load, Spinner, Slider), About (links to saucelabs.com), Logout, Reset App State.

### Catalog (reference data)

| Product | Price |
| --- | --- |
| Sauce Labs Backpack | $29.99 |
| Sauce Labs Bike Light | $9.99 |
| Sauce Labs Bolt T-Shirt | $15.99 |
| Sauce Labs Fleece Jacket | $49.99 |
| Sauce Labs Onesie | $7.99 |
| Test.allTheThings() T-Shirt (Red) | $15.99 |

### Messages observed

| Situation | Message |
| --- | --- |
| Login with nothing filled | `Epic sadface: Username is required` |
| Login without password | `Epic sadface: Password is required` |
| Wrong password | `Epic sadface: Username and password do not match any user in this service` |
| `locked_out_user` | `Epic sadface: Sorry, this user has been locked out.` |
| Open `/inventory.html` without login | `Epic sadface: You can only access '/inventory.html' when you are logged in.` |
| Checkout, empty form | `Error: First Name is required` (then Last Name, then Postal Code, one at a time) |
| Order complete | `Thank you for your order!` |

Tax observed: Backpack + Bike Light → item total $39.98, tax $3.20, total $43.18. The tax rate is **8%**, rounded to the cent.

## Behaviour per test user

| User | Observation | Suspected defect? |
| --- | --- | --- |
| `standard_user` | Everything works as described above. Login ≈ 0.1 s. | No (baseline) |
| `locked_out_user` | Cannot log in, shows locked-out message. | No (intended) |
| `problem_user` | **All 6 product images are the same "404" placeholder image.** Sort Z→A leaves the list unchanged. "Add to cart" does nothing for **Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt (Red)**. On checkout, typing in **Last Name writes into First Name**, so checkout cannot continue ("Last Name is required"). | Yes (several) |
| `error_user` | Sorting shows an alert `Sorting is broken! This error has been reported to Backtrace.` and the list is not sorted. "Add to cart" does nothing for **Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt (Red)** (same as `problem_user`). **Last Name field ignores input**, but Continue still moves to the overview. **Finish does nothing**: the order never completes. | Yes (several) |
| `performance_glitch_user` | Login takes **≈ 5.1 s** versus ≈ 0.1 s for `standard_user`. | Yes (performance) |
| `visual_user` | **Prices differ from the catalog** (e.g. Backpack $69.83, Fleece Jacket $6.91). Backpack image is the "404" placeholder. | Yes (data/visual) |

All suspected defects need to be confirmed with full reproduction steps and evidence before becoming bug reports (step 2).

## Dynamic Catalog pages

| Page | Behaviour | Testing risk |
| --- | --- | --- |
| Lazy Load | Infinite scroll: 8 items render, then "Loading…" placeholders turn into more items each time the end is reached (126 items after 10 scrolls, still loading). | There is no "last item". Tests must assert that scrolling adds items and that placeholders resolve, not a fixed count. |
| Spinner | Page starts empty, 6 products appear after ≈ 2.6 s. | A test that reads the list immediately will see nothing. |
| Slider | One item at a time with 6 navigation dots. **Advances automatically about every 2 s.** Clicking a dot shows its product. | Auto-advance can change the slide between a click and an assertion: assert right after the click, or check the dot's active state. |

These pages are good for showing **correct waiting**: web-first assertions instead of fixed sleeps.

## Risks and questions raised

1. Prices and tax are calculated in the client. Wrong totals are a P1 risk: cover the overview math with several cart combinations.
2. The cart survives page reloads (browser storage). Check what Logout and Reset App State clear.
3. Checkout validation shows **one error at a time**. Is that the intended design, or should all missing fields be listed? Recorded as a question, not a defect.
4. Can checkout be reached with an empty cart? **Yes:** an order with no items completes with total $0.00. Recorded as a question for the product owner.
5. **The cart is not cleared on logout and carries over to the next user.** `standard_user` adds Backpack and Onesie, logs out, and `visual_user` logs in to a cart with those 2 items. On a shared computer this shows one customer's cart to another. Defect candidate for every user, including the reference user.
6. Sorting is done in the client. Ties (two items at $15.99) need a defined secondary order.

## Next steps

- Turn the observed behaviour into derived requirements and test cases ([`../test-cases/saucedemo.md`](../test-cases/saucedemo.md)).
- Reproduce each suspected defect with evidence and write bug reports.
