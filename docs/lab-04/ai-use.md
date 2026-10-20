# Lab 4 — AI Use and Reflection

**LLM/Agent Used:** Antigravity (Gemini 3.8 Flash, Claude Sonnet 3.7)

---

## Selected Key Prompts (6–10)

| # | Prompt (summarized) | What I did with the result |
| :--- | :--- | :--- |
| 1 | "Read the Lab 4 handout and create the Sprint 4 Engineering Contract specification, API spec, UI spec, and test plan following the existing project structure." | Reviewed and verified all functional requirements (Actions Taken, Ticket lifecycle status transitions, role dashboards), business rules BR-01 through BR-12, and traceability mapping. |
| 2 | "Design and apply the Prisma schema migration for ActionTaken and update the seed data with realistic tickets across all 8 statuses." | Created migration `20261012104645_add_actions_taken` adding `ActionTaken` model, and updated `seed.ts` with idempotent test data across all 8 ticket statuses, assignees, and actions. |
| 3 | "Implement the Actions Taken REST APIs with server-side actor attribution and role guards." | Implemented `POST /api/staff/tickets/:id/actions-taken`, `PATCH /api/staff/tickets/:id/actions-taken/:actionId`, and `GET /api/tickets/:id/actions-taken` with strict RBAC guards, automatic `performedById` attribution, and follow-up note validation. Created test suite `server/tests/lab-04/actions-taken.api.test.ts`. |
| 4 | "Implement the ticket status transition matrix and stale-update concurrency check on the backend." | Added status transition state machine in `ticketHelpers.ts`, enforced matrix validation and `clientUpdatedAt` concurrency protection (HTTP 409 Conflict) on `PATCH /api/staff/tickets/:id`, dynamic permitted status dropdown in `StaffTicketDetail.tsx`, and created comprehensive test suites `ticket-workflow.api.test.ts` and `TicketWorkflow.test.tsx`. |
| 5 | "Create the Requester and IT Staff dashboard API endpoints with accurate metric aggregation and role guards." | Implemented `GET /api/requester/dashboard` (aggregating total open, waiting for requester, recently resolved, total closed, and recent tickets for the authenticated user) and `GET /api/staff/dashboard` (aggregating queue counts by status, priority, unassigned count, and user-assigned count). Created integration tests `requester-dashboard.api.test.ts` (7 tests) and `staff-dashboard.api.test.ts` (10 tests). |
| 6 | "Build the IT Staff and Requester dashboard UI components adhering to the Zen Green design language." | Built `StaffDashboard.tsx` and `RequesterDashboard.tsx` featuring responsive metric card grids, color-coded badges, recent tickets tables, and drill-down navigation buttons into `StaffTicketQueue` and `MyTickets`. Built component test suites `StaffDashboard.test.tsx` (9 tests) and `RequesterDashboard.test.tsx` (8 tests). |
| 7 | "Integrate the Actions Taken interactive section into IT Staff Ticket Detail and read-only view in Requester Detail." | Created `ActionsTakenSection.tsx` with list view, "+ Add Action Taken" collapsible form, conditional follow-up validation, and in-place editing. Integrated as interactive for IT Staff/Admin in `StaffTicketDetail.tsx` and read-only for Requesters in `RequesterTicketDetail.tsx`. Verified with `ActionsTaken.test.tsx` (7 tests). |
| 8 | "Implement the Playwright E2E test suites for Actions Taken, status resolution gate, and dashboards." | Created `e2e/lab-04/actions-taken-flow.spec.ts` (E2E-01), `e2e/lab-04/ticket-resolution.spec.ts` (E2E-02), and `e2e/lab-04/dashboards.spec.ts` (E2E-03). Verified complete real-browser user journeys across Requesters and IT Staff. |
| 9 | "Harden Playwright E2E selectors and execute full cross-lab regression across Labs 1 through 4." | Resolved selector collisions on login button, stabilized table row locators, and validated full regression: 132 server tests, 71 client tests, and 17 Playwright E2E tests passing with 0 regressions. |

---

## Reflection

Working with Antigravity as both a **specification agent** (Spec DD) and a **coding agent** (TDD) provided key engineering insights during Sprint 4:

1. **The Primacy of Upfront Specification (Spec DD):**
   In earlier labs, ambiguity in business rules often led to rework during UI development. In Sprint 4, using the specification agent to draft detailed contracts (`specification.md`, `api-spec.md`, `ui-spec.md`) before writing any code eliminated misunderstandings early. Specifically, clearly formalizing that *a Requester signaling problem resolution is advisory only and does not mutate authoritative status* (BR-05/BR-06) saved considerable time when implementing both the backend status machine and frontend controls.

2. **Test-Driven Traceability and Concurrency Protection:**
   Structuring acceptance criteria (AC-01 through AC-10) directly into corresponding unit, integration, and E2E test IDs ensured full traceability. When implementing stale-update concurrency detection (HTTP 409 Conflict via `clientUpdatedAt`), having failing integration tests before writing the route handler made it straightforward to ensure race conditions were properly handled without regressions.

3. **Autonomous Coding Agent Collaboration & Regression Guardrails:**
   The coding agent was highly effective at generating consistent TypeScript interfaces, Prisma queries, and Zen Green styled components. However, human supervision remained crucial for catching real-browser nuances—such as Playwright strict-mode locator ambiguities between login toggle buttons and form submit buttons, or matching table rows across desktop and mobile layouts. Maintaining an end-to-end regression suite (220 automated tests) provided total confidence that extending the application for Lab 4 preserved all authentication, ticket creation, attachment soft-removal, and user management features from Labs 1–3.

