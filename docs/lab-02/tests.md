# Lab 2 Test Plan and Results

This document defines the testing strategy, planned tests, and execution commands to verify all functional requirements and business rules for the Lab 2 sprint.

---

## 1. Test Strategy

We apply **Test-Driven Development (TDD)** and **Spec-Driven Development (Spec DD)** to verify correctness across multiple levels:
*   **Unit Tests**: Verify isolated backend logic (e.g. ticket number formatting, file extension check, file size helper).
*   **API Integration Tests**: Verify HTTP status codes, payload shapes, database state updates, validation rules, and ownership checks via Supertest.
*   **UI Component Tests**: Verify individual React components (e.g. Requester Selector, Create Ticket Form, My Tickets Dashboard, badges, and error boundary states) using Vitest and React Testing Library.
*   **End-to-End (E2E) Tests**: Verify complete multi-step user journeys (such as choosing a requester, submitting a ticket with files, dashboard filtering, and soft removing an attachment) using Playwright.

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-01 | Ticket number generator formatting | Returns string in format `TKT-YYYY-XXXXXX` (e.g., `TKT-2026-000001`). | `server/tests/lab-02/helpers.test.ts` | Pass |
| **UNIT-02** | Unit | BR-06, BR-07 | File validation helper logic | Accepts JPEG, PNG, WEBP, PDF under 5MB; rejects others. | `server/tests/lab-02/helpers.test.ts` | Pass |
| **API-01** | API | AC-01, BR-02 | Create valid ticket with attachment | Returns 201; ticket saved with status `New`, generated Ticket Number, file on disk. | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-02** | API | BR-05 | Ticket validation limits | Returns 400 Bad Request if summary < 10 chars or description < 20 chars. | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-03** | API | AC-03, BR-04 | Ticket ownership verification | Returns 403 Forbidden when requesting details of a ticket owned by another user. | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| **API-04** | API | AC-04 | Search, filtering, and paging | Returns paginated subset of tickets matching search queries and category filters. | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| **API-05** | API | BR-08 | Attachment quantity limit | Returns 400 Bad Request when trying to add a 6th active attachment to a ticket. | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-06** | API | BR-09, BR-10 | Soft remove attachment with reason | Returns 200; `deletedAt` and reason saved; download endpoint blocked with 410 Gone. | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **UI-01** | UI | AC-02 | Requester selector redirection | Redirects to `/select-requester` if no requester is stored in local storage. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-02** | UI | BR-15 | Form submit busy state | Submitting the form disables the Submit button and renders a loading spinner. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-03** | UI | BR-05 | Frontend input validation | Displays red asterisk markers and inline validation errors when fields are empty. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-04** | UI | AC-04, BR-12 | Ticket list and empty states | Renders empty state card if ticket list is empty, or table headers if populated. | `client/src/tests/lab-02/MyTickets.test.tsx` | Pass |
| **UI-05** | UI | AC-06, BR-10 | Attachment list read-only state | Displays "Removed" badge and reason for soft-removed file; hides download button. | `client/src/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-02 | Full ticket submission flow | Complete flow: select user -> open form -> fill valid data -> upload -> submit -> view success. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-02** | E2E | AC-04 | Ticket search, filter, and pagination | Complete flow: open dashboard -> filter categories -> type search -> verify pagination updates. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-06 | Attachment upload and soft removal | Complete flow: open details -> upload file -> click remove -> type reason -> confirm -> check blocked download. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-04** | E2E | AC-03 | Cross-requester URL interception | Complete flow: login as Jennifer -> attempt direct URL navigation to David's ticket -> verify redirect/access denied message. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion (AC) | Mapped Test ID(s) |
| :--- | :--- |
| **AC-01 (Successful Submission)** | `API-01`, `UI-02`, `E2E-01` |
| **AC-02 (Unauthorized Access)** | `UI-01`, `E2E-01` |
| **AC-03 (Cross-Requester Security)** | `API-03`, `E2E-04` |
| **AC-04 (My Tickets Filters & Pagination)** | `API-04`, `UI-04`, `E2E-02` |
| **AC-05 (Attachment Constraints)** | `UNIT-02`, `API-02`, `API-05`, `UI-03` |
| **AC-06 (Attachment Soft Removal)** | `API-06`, `UI-05`, `E2E-03` |

---

## 4. Responsive and Visual Checklist

These visual inspections will be performed on desktop (`1280px`), tablet (`800px`), and mobile (`375px`) viewports:

| Viewport | Element Checked | Inspection Criteria | Result | Reference Image Path |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | My Tickets Table | Columns headers display correctly, text fits without wrapping, badges are centered. | Passed | `/artifacts/lab-02/screenshots/my-tickets/desktop.png` |
| **Desktop** | Create Ticket Form | Two-column grid is centered with a max width of 1000px. | Passed | `/artifacts/lab-02/screenshots/create-ticket/desktop.png` |
| **Tablet** | Create Ticket Form | Form shifts to comfortable stacked columns; input fields are wide enough. | Passed | `/artifacts/lab-02/screenshots/create-ticket/tablet.png` |
| **Mobile** | App Header | App header title and user profile stack vertically or collapse; tabs fit on screen. | Passed | `/artifacts/lab-02/screenshots/my-tickets/mobile_header.png` |
| **Mobile** | My Tickets Cards | The table collapses into cards; no horizontal overflow or scrollbar is present. | Passed | `/artifacts/lab-02/screenshots/my-tickets/mobile.png` |
| **Mobile** | Ticket Details | Fields stack vertically; buttons occupy full width and are touch-friendly (min height 44px). | Passed | `/artifacts/lab-02/screenshots/ticket-detail/mobile.png` |

---

## 5. Test Commands

Run the following commands in their respective directories to execute the automated test suites:

### 5.1. Backend Unit and API Integration Tests
Run Vitest tests for the server:
```bash
cd server
npm run test
```

### 5.2. Frontend UI Component Tests
Run Vitest tests for the client:
```bash
cd client
npm run test
```

### 5.3. End-to-End Tests
Run Playwright integration tests:
```bash
# From workspace root
npx playwright test
```

---

## 6. Final Results

*(Test results will be pasted here upon running the test suites).*

---

## 7. Known Limitations or Deferred Tests

*   **Deferred Login Authentication**: The selector UI is a simulation only. Authentication checks (passwords, token-based sessions) are deferred to Lab 3.
*   **Static Comment Feed**: The comments listed in the ticket details view are static mock content. Add/delete comments capability is deferred to later labs.
