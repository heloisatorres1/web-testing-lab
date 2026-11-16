# Test cases: APIs (PS, RB)

Two public REST APIs. Both are tested twice on purpose: once in **Postman** (collections in [`postman/`](../../postman/), run by Newman in CI) and once in **Playwright's API client** (`tests/api/`). Postman is what most teams use to explore and share API tests; the Playwright version shows the same checks as code, next to the UI tests, with contract validation through Ajv.

## Swagger Petstore (PS)

**Base URL:** `https://petstore.swagger.io/v2` · **Contract:** [`/swagger.json`](https://petstore.swagger.io/v2/swagger.json) (Swagger 2.0)

The data is shared with everyone on the internet. Every test creates its own pet with a random ID far above the range other people use, and deletes it afterwards. Writes take a moment to be readable, so reads after a write poll until they succeed (up to 15 s) instead of failing on the first try.

| ID | Title | Pri | Steps | Expected result | Where |
| --- | --- | --- | --- | --- | --- |
| TC-PS-001 | Create, read, update, delete a pet | P1 | POST `/pet` → GET `/pet/{id}` → PUT `/pet` (status sold) → DELETE → GET | 200 on each write; responses match the `Pet` definition; after delete GET returns 404 | Playwright, Postman |
| TC-PS-002 | Unknown pet | P1 | GET `/pet/{unused id}` | 404 with `{ code: 1, type: "error", message: "Pet not found" }` | Playwright, Postman |
| TC-PS-003 | Non-numeric ID | P2 | GET `/pet/not-a-number` | 404 with an error message | Playwright |
| TC-PS-004 | Delete unknown pet | P2 | DELETE `/pet/{unused id}` | 404 | Playwright |
| TC-PS-005 | Find by status (3 values) | P2 | GET `/pet/findByStatus?status=…` after creating a pet with that status | Every pet has the requested status; the created pet is listed and matches the contract | Playwright, Postman |
| TC-PS-006 | Invalid status | P3 | GET `/pet/findByStatus?status=flying` | 200 with `[]` (no error) | Playwright, Postman |
| TC-PS-007 | Store inventory | P3 | GET `/store/inventory` | Object of integer counts | Playwright, Postman |
| TC-PS-008 | Place an order | P2 | POST `/store/order` for an own pet | 200, matches the `Order` definition, echoes id/petId/quantity/status | Playwright |
| TC-PS-009 | Response time | P3 | GET `/store/inventory` | Under 3 s (observation, not load testing) | Playwright, Postman |
| TC-PS-010 | Server refuses a pet without the required `name` | P2 | POST `/pet` with `{ id, photoUrls }` only | 400/405/422. **Actual: 200, the pet is stored.** → [BUG-010](../bug-reports/BUG-010.md) | Playwright (expected failure) |

### Findings and questions

- **BUG-010:** the server stores pets that break its own contract, so `findByStatus` returns objects without `name`. Any client that trusts the Swagger definition can crash on them.
- Pet IDs above 2^53 come back rounded in JavaScript clients (`9223372036854776000`). Not a server defect, but a client risk worth documenting.

## Restful-Booker (RB)

**Base URL:** `https://restful-booker.herokuapp.com` · **Docs:** [apidoc](https://restful-booker.herokuapp.com/apidoc/) · **Auth:** `POST /auth` with `admin` / `password123` returns a token sent as `Cookie: token=…`

| ID | Title | Pri | Steps | Expected result | Where |
| --- | --- | --- | --- | --- | --- |
| TC-RB-001 | Health check | P1 | GET `/ping` | 201 Created (the API's documented health response) | Playwright, Postman |
| TC-RB-002 | Wrong credentials | P1 | POST `/auth` with a wrong password | 200 with `{ reason: "Bad credentials" }` and no token | Playwright, Postman |
| TC-RB-003 | Create and read back | P1 | POST `/booking` → GET `/booking/{id}` | 200, `bookingid` > 0, booking echoed and stored unchanged | Playwright, Postman |
| TC-RB-004 | Find by name | P2 | GET `/booking?firstname=&lastname=` | Exactly `[{ bookingid }]` of the created booking | Playwright, Postman |
| TC-RB-005 | Full update needs a token | P1 | PUT without token → PUT with token | 403, then 200 with the new values | Playwright, Postman |
| TC-RB-006 | Partial update | P2 | PATCH `{ totalprice: 1 }` with token | 200; only `totalprice` changed | Playwright, Postman |
| TC-RB-007 | Delete | P1 | DELETE with token → GET | 201 (the API's choice), then 404 | Playwright, Postman |
| TC-RB-008 | Unknown booking | P2 | GET `/booking/0` | 404 | Playwright |
| TC-RB-009 | Incomplete booking | P2 | POST `/booking` with only `firstname` | Refused (the API answers 500; 400 would be the better status) | Playwright, Postman |
| TC-RB-010 | Checkout before checkin | P3 | POST with `checkin` after `checkout` | **Accepted and stored.** No documented rule forbids it; raised as a question, not a bug | Playwright (annotated) |

### Findings and questions

- `PUT /booking/{id}` keeps `additionalneeds` when the request omits it, so PUT behaves like a partial update for optional fields. Logged as a question for the API owner (visible in the Newman console output of TC-RB-005).
- The API uses 201 for health check and delete, and 500 for a validation error. The tests assert the documented behaviour and note the better status in the test title, so the choice is visible without failing the run.
