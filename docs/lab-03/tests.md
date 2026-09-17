# Test Plan

| ID | Type | Target | Expected Result | File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | API | Valid login | Auth cookie set; safe user data | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-02 | API | Initial pwd login | `requiresPasswordChange` true | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-03 | API | Requester ownership | 403 on other's ticket | `server/tests/lab-03/authorization.test.ts` | Pass |
| API-04 | API | Note isolation | 403 for Requester note access | `server/tests/lab-03/notes.api.test.ts` | Pass |
| API-05 | API | Admin safety | 400/409 on self-deactivation | `server/tests/lab-03/users.api.test.ts` | Pass |
| E2E-01 | E2E | Auth Flow | Login, app shell, logout succeed | `e2e/lab-03/authentication.spec.ts` | Pass |
| E2E-02 | E2E | First Login | Blocked until password changed | `e2e/lab-03/first-login.spec.ts` | Pass |
| E2E-03 | E2E | Staff Flow | Queue search, open, claim, note | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| E2E-04 | E2E | Admin Flow | Create user, role filter | `e2e/lab-03/user-admin.spec.ts` | Pass |
