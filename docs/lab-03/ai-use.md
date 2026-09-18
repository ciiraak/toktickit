# Lab 3 — AI Use and Reflection

**LLM/Agent Used:** Antigravity (Gemini 3.5 Flash, Gemini 3.7 Flash, Claude Opus 4.6, Claude Sonnet 3.7)

---

## Selected Key Prompts (6–10)

| # | Prompt (summarized) | What I did with the result |
| :--- | :--- | :--- |
| 1 | "Review the Lab 3 assignment guidelines and create a comprehensive implementation plan for Sprint 3." | Examined the sprint goals, role definitions (Requester, IT Staff, Administrator), and data migration requirements, then approved the implementation plan. |
| 2 | "Implement the authentication backend with HTTP-only JWT cookies and password hashing via bcrypt." | Verified that JWT secrets and cookie settings (`HttpOnly`, `SameSite=Strict`) follow best security practices and validated token creation on login. |
| 3 | "Build the IT Staff Queue and Ticket Detail operations with private internal notes." | Verified server-side RBAC guards ensuring requesters receive HTTP 403 when attempting to access internal notes or perform staff operations. |
| 4 | "Implement Issue 6: Administrator User Management with safety guards." | Verified business rules BR-08 and BR-09 (preventing administrator self-deactivation, guarding the last active admin, and rejecting duplicate emails). |
| 5 | "Write comprehensive automated API tests for all Lab 3 endpoints." | Ran Vitest in the server directory and verified all 55 integration tests passed across authentication, notes isolation, authorization, staff queue, and user administration. |
| 6 | "Why does the browser show 'Authentication required. Missing token'?" | Provided context to the AI, which explained that the frontend was still using the Lab 2 requester selector without sending a JWT cookie. I guided the AI to implement the full Login UI and interstitial password change flow. |
| 7 | "Fix ticket submission when logged in as a real user." | Guided the AI to connect `CreateTicket`, `MyTickets`, and `RequesterTicketDetail` components to `AuthContext` instead of relying only on legacy development state. |
| 8 | "Create the full Playwright E2E test suite covering all four E2E scenarios." | Reviewed and executed `authentication.spec.ts`, `first-login.spec.ts`, `staff-ticket-flow.spec.ts`, and `user-admin.spec.ts` to ensure complete end-to-end verification. |
| 9 | "Generate all final documentation for Lab 3 (spec, api-spec, ui-spec, tests, reviewer, ai-use, submission-report)." | Inspected every markdown document for technical accuracy, formatting compliance, and alignment with course rubrics. |

---

## Reflection

Developing Sprint 3 with an AI pair programmer emphasized the importance of architectural consistency across authentication layers. Implementing multi-role RBAC required careful coordination between database models, Express middleware (`requireAuth`, `requireRole`), and React state contexts.

One of the most critical insights was handling context transitions during progressive refactoring: while backend endpoints were upgraded to JWT cookie authentication, older frontend components were still reading mock headers. By identifying the root cause through server logs and prompt collaboration, we unified the client-side authentication model so that both unit tests (which run in simulated DOMs) and real browser sessions behave consistently.

Furthermore, implementing safety business rules—such as preventing self-deactivation and protecting the last active administrator—highlighted how AI assistants excel at generating validation logic when guided by explicit specifications. The automated test suites (55 server tests, 42 client tests, and full Playwright E2E specs) provided continuous regression protection throughout the sprint, giving high confidence in the quality and security of the final release.
