# Lab 3 Test Plan & Verification Record

## 1. Overview
Sprint 3 quality assurance encompasses unit tests, integration API tests, component tests, and full end-to-end (E2E) browser automation using Playwright and Vitest.

---

## 2. Test Plan Matrix

| ID | Layer | Target Feature | Expected Result | Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | API | Valid Login Credentials | Sets HTTP-only auth cookie; returns safe user profile without passwordHash | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-02** | API | Initial Password Login | Returns `requiresPasswordChange: true` | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-03** | API | Requester Ownership | Returns HTTP 403 when requesting tickets/attachments of other users | `server/tests/lab-03/authorization.test.ts` | **Pass** |
| **API-04** | API | Note Isolation Guard | Returns HTTP 403 when Requester attempts to post or read internal notes | `server/tests/lab-03/notes.api.test.ts` | **Pass** |
| **API-05** | API | Admin Safety Guard | Rejects self-deactivation and last admin removal with HTTP 400 | `server/tests/lab-03/users.api.test.ts` | **Pass** |
| **API-06** | API | Staff Queue & Filter | Search, filter by status/priority, sort, and paginate through tickets | `server/tests/lab-03/staff-queue.api.test.ts` | **Pass** |
| **API-07** | API | Staff Ticket Operations | Successfully update owner, IT priority, and ticket status via PATCH | `server/tests/lab-03/notes.api.test.ts` | **Pass** |
| **API-08** | API | User Directory CRUD | Create, edit, search, filter users, and reset temporary passwords | `server/tests/lab-03/users.api.test.ts` | **Pass** |
| **UI-01** | Component | Staff Queue View | Renders desktop table / mobile cards with filtering and search | `client/tests/lab-03/StaffTicketQueue.test.tsx` | **Pass** |
| **UI-02** | Component | Staff Operations Detail | Modifies assignee, priority, status; posts internal notes & public comments | `client/tests/lab-03/StaffTicketDetail.test.tsx` | **Pass** |
| **UI-03** | Component | Requester Comments | Renders comments stream and handles "Problem Appears Resolved" feedback | `client/tests/lab-03/RequesterTicketDetail.comments.test.tsx` | **Pass** |
| **UI-04** | Component | Admin User Directory | Directory search, filter, creation/edit modals, and password reset | `client/tests/lab-03/AdminUserManagement.test.tsx` | **Pass** |
| **E2E-01** | E2E | Auth Lifecycle | Login, role navigation in shell, invalid credentials alert, and logout | `e2e/lab-03/authentication.spec.ts` | **Pass** |
| **E2E-02** | E2E | Mandatory First Login | Interstitial blocks navigation until new password is submitted | `e2e/lab-03/first-login.spec.ts` | **Pass** |
| **E2E-03** | E2E | Staff Ticket Flow | Queue search, open ticket detail, assign owner, append internal note | `e2e/lab-03/staff-ticket-flow.spec.ts` | **Pass** |
| **E2E-04** | E2E | Admin Flow | Create new user with temporary password, filter directory by role | `e2e/lab-03/user-admin.spec.ts` | **Pass** |

---

## 3. Automated Test Execution Commands

### 3.1 Server Integration Tests
```powershell
cd server
npm run test -- tests/lab-03/
```
*Result: 5 test suites, 55 tests passed (100% green).*

### 3.2 Client Component & Unit Tests
```powershell
cd client
npm run test
```
*Result: 9 test suites, 42 tests passed (100% green).*

### 3.3 End-to-End Playwright Tests
```powershell
npx playwright test e2e/lab-03/
```
*Result: 4 test suites covering authentication, first login, staff flow, and admin flow passed.*
