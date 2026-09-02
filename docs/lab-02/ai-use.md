# Lab 2 — AI Use and Reflection

**LLM/agent used**: Antigravity (Gemini 3.5 Flash, Gemini 3.7 Flash, Claude Opus 4.6)

## Selected Key Prompts (6–10)

| # | Prompt (summarized) | What I did with the result |
| :--- | :--- | :--- |
| 1 | "Review the Lab 2 assignment PDF and build the implementation plan for the specification files." | Checked the plan for coverage of all required sections (specification, ui-spec, api-spec, tests, reviewer, ai-use) and approved it. |
| 2 | "Draft the sprint engineering specification for Lab 2." | Verified functional requirements (FR-01 to FR-10) and business rules (BR-01 to BR-15) are aligned with PDF guidelines. Corrected category and priority naming to match seed data. |
| 3 | "Create the Zen Green UI specification (ui-spec.md) covering layout, tokens, components, and responsiveness." | Checked colour tokens against PDF table and validated responsive breakpoint rules. |
| 4 | "Create the REST API contract (api-spec.md) with schemas, endpoints, and validation requirements." | Verified endpoint naming, query parameter defaults, ownership guard rules, and error response codes. |
| 5 | "Proceed with feature 9 — Ticket Detail Screen and Attachment Management." | Reviewed the proposed endpoints (GET /api/tickets/:id, POST /api/tickets/:id/attachments, GET/DELETE /api/attachments/:id) and the UI component design, then approved the plan. |
| 6 | "Do everything you need for full grade — write all remaining tests." | Verified the generated test files (unit, API integration, UI component, and Playwright E2E) covered every acceptance criterion and business rule in the specification. Manually re-ran failing tests and reviewed error output. |
| 7 | "Still have the problem — read the chat to get context, then why do I have the problem?" | Provided screenshots of the Docker database, migration status, and frontend error. The AI identified that the ticket number generator was using `prisma.ticket.count` which caused collision crashes (P2002) and refactored it to use `findFirst` + `findUnique` for collision-free generation. I validated the fix by re-running the server. |
| 8 | "Cancel all, I was on the wrong GitHub branch — go back to before." | The AI cleaned the working tree and confirmed the correct `lab2` branch was active. I verified the branch state before continuing. |
| 9 | "Finish all the previous tests so everything passes according to the PDF's criteria." | The AI fixed a Playwright E2E-03 selector issue (row click not navigating to detail view) and updated the unit test mocks to match the refactored `generateTicketNumber` function. I verified all 55 tests (29 server + 19 client + 7 E2E) passed green. |

## Reflection

Working with an AI pair programmer for Lab 2 significantly accelerated the boilerplate-heavy parts of development — schema definitions, CRUD endpoints, and repetitive test scaffolding — allowing me to focus on reviewing correctness and making design decisions. The most valuable lesson was learning to provide precise, contextual prompts: vague instructions like "fix it" produced generic solutions, whereas sharing exact error messages (e.g., the Prisma P2002 unique-constraint crash with screenshots) led to targeted, correct fixes. I also learned the importance of verifying AI-generated test selectors — the Playwright E2E-03 test failed because the AI used `td:has-text(...)` instead of targeting the `<tr>` row element with the click handler, which required me to inspect the DOM snapshot and guide the correction. Overall, the AI acted as a capable junior developer: fast at producing code, but requiring careful review and explicit corrections when its assumptions about DOM structure, mock shapes, or Prisma API surfaces diverged from the actual implementation.
