# Test cases: QA Workspace (QW)

**System:** https://heloisatorres1.github.io/qa-workspace/ (production build on GitHub Pages)
**Specification:** the app's public [README](https://github.com/heloisatorres1/qa-workspace#readme). The requirements below quote the rules it states.

## Why test it from a separate repo

QA Workspace already has unit tests and end-to-end tests that run against a local build. This suite is different on purpose:

- **Black-box:** it only uses the deployed site and the public README, like an independent QA team would.
- **Production check:** it runs after each deploy, so it also catches problems in the build or hosting, not only in the code.
- **Different coverage:** cross-browser (Firefox, WebKit), accessibility scans and specification rules, rather than repeating the app's own journey tests.

Every test starts in a fresh browser context, so it begins with the built-in fictional fixture data (project *Orbit Garden*, build 0.8.4, which has 2 open critical bugs).

## Requirements (from the README)

| ID | Requirement |
| --- | --- |
| REQ-QW-01 | Capture has one composer for **Bug**, **Feedback** and **Question**, with inline validation. |
| REQ-QW-02 | Severity and priority are two separate required fields on a bug. |
| REQ-QW-03 | A question is not a bug: it has an owner and an answer, and converting it to a bug is a deliberate action. |
| REQ-QW-04 | Triage can filter by type, severity, status, build and owner. |
| REQ-QW-05 | "Ready" is unavailable while critical bugs are open. Every accepted risk needs a rationale and an owner. |
| REQ-QW-06 | Saving a release decision freezes its evidence and message as a revision. |
| REQ-QW-07 | Pass rate = passed / applicable (excluding *Not applicable*); execution rate = (passed + failed + blocked) / applicable. |
| REQ-QW-08 | Changes are saved in the browser; Reset demo restores the fixtures. |
| REQ-QW-09 | Night mode follows the system and can be switched by hand (System / Light / Dark). |
| REQ-QW-10 | The app is usable on narrow screens and with the keyboard. |

## Test cases

| ID | Title | Req | Pri | Steps | Expected result | Automation |
| --- | --- | --- | --- | --- | --- | --- |
| TC-QW-001 | Smoke: every main page opens | — | P1 | Open Overview, Capture, Triage, Test Lab, Releases, Library, Settings, Search | Each page shows its heading; no console errors; no failed requests | UI (post-deploy smoke) |
| TC-QW-002 | Unknown route | — | P3 | Open `#/does-not-exist` | Not-found page with a way back | UI |
| TC-QW-003 | Bug: required fields | 01, 02 | P1 | Capture → Bug → submit empty | Inline errors on Title, Project, Severity, Priority, Steps to reproduce, Expected result, Actual result | UI, BDD |
| TC-QW-004 | Bug: severity and priority are independent | 02 | P1 | Fill a bug with **Low** severity and **P1** priority → submit | Accepted and stored with exactly those values (no automatic coupling) | UI, BDD |
| TC-QW-005 | Feedback: required fields | 01 | P2 | Capture → Feedback → submit empty | Inline errors on Title, Project, Observation | UI |
| TC-QW-006 | Question: required fields | 01, 03 | P2 | Capture → Question → submit empty | Inline errors on Title, Project, Who should answer, Question | UI |
| TC-QW-007 | Captured bug appears in Triage | 01, 04 | P1 | Submit a valid bug → open Triage → search by its title | The bug is listed with the given severity and priority | UI, BDD |
| TC-QW-008 | Triage filters combine | 04 | P2 | Filter severity = Critical, then add a build filter | Only matching findings remain; clearing the filters restores the full list | UI |
| TC-QW-009 | Question converts to a linked bug only on purpose | 03 | P2 | Open a question in Triage → convert to bug | A linked bug draft is created; the original question still exists | UI |
| TC-QW-010 | "Ready" blocked by open criticals (decision table) | 05 | P1 | Releases → 0.8.4 → decision step | **Ready** is disabled with `Unavailable while critical bugs are unresolved.` | UI, BDD |
| TC-QW-011 | Accepted risk needs rationale and owner | 05 | P1 | Choose **Ready with accepted risks** → add a risk without rationale or owner → save | Save is refused with `Accepted risk <id> needs a rationale and an owner.` | UI, BDD (outline) |
| TC-QW-012 | Decision needs a rationale | 05 | P2 | Choose **Hold** with an empty rationale → save | `Add a rationale so the decision can be understood later.` | UI |
| TC-QW-013 | Saved decision is frozen | 06 | P1 | Save a Hold decision → change a bug in Triage → reopen the release | The saved revision still shows the original evidence and message | UI |
| TC-QW-014 | Metrics follow the stated formulas | 07 | P1 | Open a completed run → read its counts and rates | Pass rate equals passed / applicable for the shown counts (computed in the test); execution rate lies between the pass rate and 100%. The release message does not show failed and blocked counts, so from outside the execution-rate formula can only be checked within those bounds | UI |
| TC-QW-015 | Changes survive reload | 08 | P2 | Capture a bug → reload the page | The bug is still in Triage | UI |
| TC-QW-016 | Reset demo restores fixtures | 08 | P2 | Capture a bug → Settings → Reset demo → confirm | The captured bug is gone; fixture data is back | UI |
| TC-QW-017 | Theme switch | 09 | P3 | Emulate dark system theme → check; switch to Light by hand → reload | Dark by default under a dark system; manual Light choice survives reload | UI |
| TC-QW-018 | Narrow layout | 10 | P2 | Open at the Pixel 7 viewport | Navigation collapses behind a menu button; no horizontal scroll | UI (mobile project) |
| TC-QW-019 | Keyboard search shortcut | 10 | P3 | Press Ctrl+K → type a finding ID → Enter | Search field gets focus; results show the finding | UI |
| TC-QW-020 | Accessibility scan | 10 | P2 | Run axe on Overview, Capture, Triage, Releases | No critical or serious violations; any found are reported as bugs | UI (axe) |
| TC-QW-021 | Cross-browser smoke | — | P1 | Run TC-QW-001 and TC-QW-003 in Firefox and WebKit | Same results as Chromium | UI (browser matrix) |

## Traceability summary

| Requirement | Test cases |
| --- | --- |
| REQ-QW-01 | 003, 005, 006, 007 |
| REQ-QW-02 | 003, 004 |
| REQ-QW-03 | 006, 009 |
| REQ-QW-04 | 007, 008 |
| REQ-QW-05 | 010, 011, 012 |
| REQ-QW-06 | 013 |
| REQ-QW-07 | 014 |
| REQ-QW-08 | 015, 016 |
| REQ-QW-09 | 017 |
| REQ-QW-10 | 018, 019, 020 |
