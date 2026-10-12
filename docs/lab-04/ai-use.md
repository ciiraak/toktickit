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
| 5 | "Create the Requester and IT Staff dashboard API endpoints with accurate metric aggregation." | *To be documented during Phase 4 implementation.* |
| 6 | "Build the IT Staff and Requester dashboard UI components under the Zen Green design system." | *To be documented during Phase 4 implementation.* |
| 7 | "Integrate the Actions Taken interactive section into IT Staff Ticket Detail and read-only view in Requester Detail." | *To be documented during Phase 5 implementation.* |
| 8 | "Implement the Playwright E2E test suites for Actions Taken, status resolution gate, and dashboards." | *To be documented during Phase 6 implementation.* |

---

## Reflection

*A detailed reflection on specification-agent and coding-agent use will be completed upon conclusion of the Sprint 4 implementation and regression verification.*
