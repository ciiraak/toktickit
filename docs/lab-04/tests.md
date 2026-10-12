# Lab 4 Test Plan & Verification Record

## 1. Overview
Sprint 4 quality assurance encompasses integration API tests, frontend component tests, workflow state transition validation, and full end-to-end (E2E) browser automation using Vitest and Playwright. The plan ensures 100% traceability to Sprint 4 Functional Requirements and Acceptance Criteria while validating regression across all Labs 1–3 increments.

---

## 2. Test Plan Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | API | FR-01 / AC-01 | Create valid Action Taken | Created under correct Ticket with authenticated actor recorded as `performedById` | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-02** | API | FR-04 / AC-02 | Follow-Up Note Validation | Fails with HTTP 400 when `followUpRequired=true` but `followUpNote` is empty | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-03** | API | FR-05 / AC-03 | Requester Action Taken Guard | Returns HTTP 403 when Requester attempts to `POST` or `PATCH` Actions Taken | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-04** | API | FR-05 / AC-04 | Requester Action Read Access | Requester views Actions Taken on owned ticket; returns 403 on other user's ticket | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-05** | API | FR-03 / AC-01 | Update Action Taken | Staff updates description/result on existing Action Taken | `server/tests/lab-04/actions-taken.api.test.ts` | **Pass** |
| **API-06** | API | FR-06 / AC-05 | Permitted Status Transitions | Advances status through permitted paths (`New` → `Open` → `In Progress` → `Resolved`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-07** | API | FR-06 / AC-06 | Disallowed Status Transitions | Rejects illegal transitions (e.g. `New` → `Closed`, `Cancelled` → `Open`) with HTTP 400 | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-08** | API | FR-07 / AC-07 | Advisory Resolution Gate | Requester resolved comment posts public comment but does not alter authoritative status | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-09** | API | FR-08 / AC-08 | Stale Concurrency Protection | Rejects status update with HTTP 409 Conflict when client `updatedAt` is stale | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Pass** |
| **API-10** | API | FR-09 / AC-09 | Requester Dashboard Metrics | Returns accurate counts and recent tickets strictly for authenticated requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | **Planned** |
| **API-11** | API | FR-10 / AC-10 | Staff Dashboard Metrics | Returns system-wide queue metrics, unassigned count, and user-assigned count | `server/tests/lab-04/staff-dashboard.api.test.ts` | **Planned** |
| **UI-01** | Component | FR-10 / AC-10 | IT Staff Dashboard View | Renders operational metric cards, recent tickets, and drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | **Planned** |
| **UI-02** | Component | FR-09 / AC-09 | Requester Dashboard View | Renders requester metrics, recent ticket cards, and empty state | `client/tests/lab-04/RequesterDashboard.test.tsx` | **Planned** |
| **UI-03** | Component | FR-01 / AC-01 | Actions Taken List & Form | Renders action items, toggles create form, enforces follow-up note input | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **UI-04** | Component | FR-06 / AC-05 | Workflow Transition UI | Dropdown dynamically lists only valid target statuses based on current ticket state | `client/tests/lab-04/TicketWorkflow.test.tsx` | **Pass** |
| **E2E-01** | E2E | FR-01 / AC-01 | Actions Taken Workflow | IT staff navigates to ticket, logs an Action Taken, and verifies it appears in list | `e2e/lab-04/actions-taken-flow.spec.ts` | **Planned** |
| **E2E-02** | E2E | FR-06 / AC-07 | Ticket Resolution & Advisory Gate | Requester signals problem resolved; staff reviews and formally closes ticket | `e2e/lab-04/ticket-resolution.spec.ts` | **Planned** |
| **E2E-03** | E2E | FR-09,10 / AC-09,10 | Dashboards & Drill-down | Requester & Staff dashboards display correct counts with working queue filter links | `e2e/lab-04/dashboards.spec.ts` | **Planned** |

---

## 3. Automated Test Execution Commands

### 3.1 Server Integration Tests
```powershell
cd server
npm run test -- tests/lab-04/
```

### 3.2 Client Component Tests
```powershell
cd client
npm run test -- tests/lab-04/
```

### 3.3 End-to-End Playwright Tests
```powershell
npx playwright test e2e/lab-04/
```
