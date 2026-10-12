# Sprint 4 Engineering Specification

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by introducing Actions Taken for IT Staff, enforcing strict Ticket status lifecycle transitions and the resolution gate, delivering role-appropriate operational dashboards for Requesters, IT Staff, and Administrators, and hardening the entire application under the Zen Green design system with zero regression across Labs 1 through 3.

## 2. Stakeholder Request Interpretation
The stakeholder requires a structured way to plan, track, and record concrete operational work performed on tickets:
1. **Actions Taken Subsystem**: Each ticket can have multiple Actions Taken entries recording: Action Date/Time, Action Description, Result, Performed by (auto-populated with authenticated IT staff), Follow-Up Required? (boolean), Follow-up Note (mandatory when follow-up is needed), and Attachment Notes (file/image references).
2. **Separation of Coordination and Execution**: The primary Ticket Owner coordinates the ticket as a whole, but any active IT Staff member can execute work and log Actions Taken.
3. **Formal Resolution Gate**: Requesters may signal that their issue appears resolved, but this feedback is advisory; only IT Staff or Administrators can formally advance tickets to `Resolved` or `Closed`.
4. **Role Dashboards**: Requesters need a concise dashboard tracking open, waiting, and resolved items; IT Staff need an operational dashboard displaying queue counts, tickets owned by them, and urgent items; Administrators can access operational metrics alongside user directory management.
5. **Polished Application**: All previous features (authentication, ticket creation, comments, internal notes, attachments, admin management) must continue to work seamlessly under the Zen Green design language.

---

## 3. Scope

### Included
*   **Actions Taken Model & API**: Database schema, relations, migration, seed, and endpoints to create, list, and update Actions Taken.
*   **Automatic Actor Tracking**: Backend automatically attributes `performedById` to the authenticated user's session.
*   **Actions Taken UI**: Ticket Detail integration with responsive list/table, create mode with validation, and view/edit modes.
*   **Ticket Status Lifecycle Enforcement**: Complete status transition matrix (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`) enforced on the backend.
*   **Advisory Resolution Gate**: Clear distinction between Requester "Problem Appears Resolved" feedback and formal IT Staff resolution.
*   **Concurrency & Stale Update Handling**: Detection of stale modifications using `updatedAt` to prevent unintentional overwrite of concurrent ticket changes.
*   **Requester Dashboard**: Dedicated view and endpoint (`/api/requester/dashboard`) summarizing authenticated requester's tickets and quick actions.
*   **IT Staff & Admin Dashboard**: Dedicated view and endpoint (`/api/staff/dashboard`) displaying operational metrics, queue drill-downs, and urgent tickets.
*   **Zen Green App Shell Navigation**: Persistent dashboard navigation with active tab indicators and role-based permissions.
*   **Final Hardening & Regression**: Complete regression verification across Labs 1–3, accessibility compliance, keyboard focus, and zero horizontal scrolling.

### Explicitly Excluded (Handout Section 4.2)
*   Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
*   Email, SMS, LINE, push, or other external notification services.
*   Inventory consumption, spare-parts management, purchasing, or cost accounting.
*   Time-sheet billing, payroll, or detailed labor-cost calculations.
*   Multi-level approval workflows and electronic signatures.
*   Advanced business-intelligence tools, custom report builders, or export warehouses.
*   Multi-tenant organizations and production-scale cloud operations.
*   New product features not approved in the Sprint 4 engineering contract.

---

## 4. Functional Requirements

*   **FR-01 (Actions Taken Logging)**: IT Staff and Administrators can log an Action Taken under any accessible ticket, capturing action date/time, description, result, follow-up requirement, follow-up note, and attachment notes.
*   **FR-02 (Automatic Performed-By Attribution)**: The backend automatically records the authenticated IT Staff/Admin user as `performedBy` on Action Taken creation. Clients cannot forge or override this value.
*   **FR-03 (Actions Taken Update)**: IT Staff and Administrators can update an existing Action Taken entry (e.g. updating results or follow-up notes).
*   **FR-04 (Follow-Up Note Validation)**: When `followUpRequired` is marked true, the backend and UI enforce a non-empty `followUpNote`.
*   **FR-05 (Requester Actions Taken Visibility)**: Authenticated Requesters can view Actions Taken on tickets they own in a read-only view. Requesters are strictly forbidden from creating or updating Actions Taken.
*   **FR-06 (Ticket Status Lifecycle Enforcement)**: The backend validates all ticket status transitions against a strict permitted transition matrix. Attempts to bypass valid transitions return HTTP `400 Bad Request`.
*   **FR-07 (Advisory Resolution Feedback)**: Requesters can indicate that their issue appears resolved, generating an advisory public comment without changing the ticket status to `Resolved`.
*   **FR-08 (Concurrency & Stale-Update Detection)**: Status transitions and ticket updates accept a last-known timestamp/version; if a concurrent modification occurred, the backend returns HTTP `409 Conflict`.
*   **FR-09 (Requester Dashboard)**: Requesters access a dashboard displaying concise metrics (Total Open Tickets, Tickets Waiting for Requester, Recently Updated, Recently Resolved) and quick links.
*   **FR-10 (IT Staff & Admin Dashboard)**: IT Staff and Administrators access an operational dashboard displaying queue status counts (New, Open, In Progress, Waiting for Requester), My Assigned tickets, Unassigned tickets, and urgent tickets with clickable drill-down links.
*   **FR-11 (Role-Based Dashboard Navigation)**: The top navigation bar displays a "Dashboard" tab for all authenticated roles, navigating to the role-appropriate dashboard view.
*   **FR-12 (Full Regression Preservation)**: All existing features from Labs 1–3 (authentication, password reset, attachments, public comments, internal notes, admin user directory) remain functional.

---

## 5. Business Rules (BR)

*   **BR-01 (Single Ticket Association)**: An Action Taken belongs to exactly one Ticket.
*   **BR-02 (Separation of Coordination and Execution)**: A Ticket has at most one primary Ticket Owner, but any active IT Staff or Administrator may log Actions Taken on the ticket.
*   **BR-03 (Automatic Authenticated Performed By)**: The `performedById` on an Action Taken is derived exclusively from the authenticated JWT session on the server. Client-supplied actor IDs are ignored.
*   **BR-04 (Mandatory Follow-Up Note)**: If `followUpRequired` is `true`, `followUpNote` must be a non-empty string. If `followUpRequired` is `false`, `followUpNote` is optional or null.
*   **BR-05 (Actions Taken Authorization Gate)**:
    *   `POST /api/staff/tickets/:id/actions-taken`: Restricted to `IT_STAFF` and `ADMINISTRATOR`. Requesters receive HTTP `403 Forbidden`.
    *   `PATCH /api/staff/tickets/:id/actions-taken/:actionId`: Restricted to `IT_STAFF` and `ADMINISTRATOR`.
    *   `GET /api/tickets/:id/actions-taken`: Requesters can only access Actions Taken for tickets where `ticket.requesterId == authenticatedUser.id`. Accessing other tickets returns HTTP `403 Forbidden`.
*   **BR-06 (Permitted Ticket Status Transition Matrix)**:
    Only the following status transitions are allowed:
    *   `New` → `Open`, `In Progress`, `Cancelled`
    *   `Open` → `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
    *   `In Progress` → `Waiting for Requester`, `Resolved`, `Cancelled`
    *   `Waiting for Requester` → `In Progress`, `Resolved`, `Cancelled`
    *   `Resolved` → `Closed`, `Reopened`
    *   `Closed` → `Reopened`
    *   `Reopened` → `In Progress`, `Resolved`, `Cancelled`
    *   `Cancelled` → *Terminal state* (no transitions allowed)
    Transitions to any other status return HTTP `400 Bad Request`.
*   **BR-07 (Formal Resolution Gate)**: Requesters cannot transition ticket status to `Resolved` or `Closed`. A Requester's "Problem Appears Resolved" button only appends an automated public comment.
*   **BR-08 (Concurrency Protection)**: When updating ticket status, the client must submit the ticket's known `updatedAt` timestamp. If the database record has been modified by another user in the interim, the update is rejected with HTTP `409 Conflict`.
*   **BR-09 (Requester Dashboard Isolation)**: Requester dashboard metrics count only tickets where `requesterId == authenticatedUser.id`. Requesters cannot access other requesters' metrics.
*   **BR-10 (IT Staff Dashboard Aggregation)**:
    *   `Total New`: Tickets where `currentStatus == "New"`.
    *   `Total Open`: Tickets where `currentStatus == "Open"`.
    *   `Total In Progress`: Tickets where `currentStatus == "In Progress"`.
    *   `Waiting for Requester`: Tickets where `currentStatus == "Waiting for Requester"`.
    *   `My Assigned`: Tickets where `ownerId == authenticatedUser.id` and status not in (`Closed`, `Cancelled`).
    *   `Unassigned`: Tickets where `ownerId == null` and status not in (`Closed`, `Cancelled`).
*   **BR-11 (Active Staff Assignment)**: Actions Taken can only be created by active users (`isActive = true`). Inactive users cannot perform actions or be assigned tickets.
*   **BR-12 (Data Preservation & Migration Integrity)**: Database schema migration must retain all existing Lab 1–3 entities (`User`, `Ticket`, `Attachment`, `Comment`, `Note`, `Category`, `RelatedSystem`). Tickets created before Lab 4 with 0 Actions Taken remain valid and functional.

---

## 6. UI Specification Summary
The UI adheres strictly to the **Zen Green** design language (`docs/lab-04/ui-spec.md`):
*   **Top Navigation**: Adds a prominent "Dashboard" tab for all roles, dynamically linking to the Requester Dashboard or Staff Dashboard based on user role.
*   **Requester Dashboard (`/dashboard`)**:
    *   Greeting banner with authenticated user name.
    *   Metric cards: My Open Tickets, Waiting for My Response, Recently Resolved, Closed Tickets.
    *   Recent Tickets list with status and priority badges, creation date, and direct detail links.
    *   Quick actions: "Create Ticket", "View My Tickets".
*   **IT Staff & Administrator Dashboard (`/dashboard`)**:
    *   Operational metric cards: New, Open, In Progress, Waiting for Requester, My Assigned.
    *   Clickable cards with drill-down query filters directing to `/staff/queue?status=...` or `/staff/queue?owner=me`.
    *   Recent & Urgent tickets table with priority highlights and direct access.
    *   Quick actions: "Create Ticket", "Search Tickets", "My Queue".
*   **Actions Taken Section (Ticket Detail)**:
    *   **IT Staff View**: Interactive section below conversations with:
        *   "Add Action Taken" collapsible card/form.
        *   Form fields: Action Date/Time (defaults to now), Description, Result, Follow-Up Required toggle, Follow-Up Note (conditional input), Attachment Notes.
        *   Table/Card list of recorded actions showing Date, Performed By, Description, Result, Follow-Up badge, Attachment references, and Edit action.
    *   **Requester View**: Clean read-only timeline/card presentation showing what actions IT staff have taken on their ticket.
*   **Status Transition Dropdown**:
    *   Only displays valid destination statuses according to the transition matrix (BR-06).
    *   Terminal and invalid transitions are disabled or excluded.

---

## 7. Data Changes & Migration

### 7.1 ActionTaken Model (Prisma)
```prisma
model ActionTaken {
  id               Int      @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime   DateTime @default(now())
  description      String
  result           String
  performedById    Int
  performedBy      User     @relation(fields: [performedById], references: [id])
  followUpRequired Boolean  @default(false)
  followUpNote     String?
  attachmentNotes  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
}
```

### 7.2 Ticket Model Enhancement
*   Add relation field `actionsTaken ActionTaken[]`.
*   Ensure `updatedAt` is properly maintained for concurrency verification.

### 7.3 User Model Enhancement
*   Add relation field `actionsTaken ActionTaken[]`.

### 7.4 Justification of Database Design Decisions (Handout Section 5.1)
1. **Decision 1: Direct Foreign Key to `User` for `performedById` instead of free-text string**:
   *Justification*: Storing `performedById` as a foreign key ensures referential integrity, supports auditable reporting, allows immediate display of user names/roles, and prevents spoofing of actions performed by staff members.
2. **Decision 2: Dedicated `ActionTaken` Table with Ticket Cascade Deletion**:
   *Justification*: Separating Actions Taken from comments and notes preserves domain clarity: comments represent dialogue, notes represent private staff thoughts, and Actions Taken represent concrete operational work. Cascading deletion ensures ticket cleanup during tests without orphan records.

### 7.5 Seed Data Expansion
*   Idempotent seed script (`server/prisma/seed.ts`) populating:
    *   Tickets across all 8 statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
    *   Tickets with 0, 1, and multiple Actions Taken.
    *   Actions with `followUpRequired: true` (with notes) and `false`.
    *   Diverse assignees to verify non-zero and zero dashboard metrics for different staff members.

---

## 8. API Contract Summary
Detailed contracts defined in `docs/lab-04/api-spec.md`:
*   `GET /api/tickets/:id/actions-taken`: Retrieve Actions Taken for a ticket (ownership-checked for Requesters).
*   `POST /api/staff/tickets/:id/actions-taken`: Create an Action Taken (IT Staff / Admin only, auto-performedBy).
*   `PATCH /api/staff/tickets/:id/actions-taken/:actionId`: Update an Action Taken (IT Staff / Admin only).
*   `PATCH /api/staff/tickets/:id`: Update ticket status with transition matrix enforcement and concurrency check.
*   `GET /api/requester/dashboard`: Retrieve authenticated Requester's dashboard statistics and recent tickets.
*   `GET /api/staff/dashboard`: Retrieve operational queue metrics, my assigned count, and recent tickets.

---

## 9. Acceptance Criteria

*   **AC-01 (Actions Taken Creation)**: Given an authenticated IT Staff member and a valid ticket, when submitting an Action Taken with valid fields, it is saved under the ticket with `performedById` set to the authenticated user.
*   **AC-02 (Follow-Up Validation)**: Given an IT Staff member submitting an Action Taken with `followUpRequired = true` and an empty `followUpNote`, the backend rejects the request with HTTP `400 Bad Request`.
*   **AC-03 (Requester Actions Taken Authorization)**: Given an authenticated Requester attempting to `POST` or `PATCH` an Action Taken, the backend returns HTTP `403 Forbidden`.
*   **AC-04 (Requester Actions Taken Read Access)**: Given an authenticated Requester viewing their own ticket, Actions Taken are returned. Given a Requester attempting to view Actions Taken for another user's ticket, HTTP `403 Forbidden` is returned.
*   **AC-05 (Permitted Status Transitions)**: Given a ticket in `Open` status, an IT Staff member can transition it to `In Progress`, `Waiting for Requester`, `Resolved`, or `Cancelled`.
*   **AC-06 (Invalid Status Transition Rejection)**: Given a ticket in `New` status, an attempt to transition directly to `Closed` is rejected with HTTP `400 Bad Request`.
*   **AC-07 (Advisory Resolution Gate)**: Given an authenticated Requester clicking "Problem Appears Resolved", an automated public comment is posted, but the ticket status remains unchanged.
*   **AC-08 (Concurrency Protection)**: Given an IT Staff user attempting to update a ticket with an outdated `updatedAt` timestamp, the backend returns HTTP `409 Conflict`.
*   **AC-09 (Requester Dashboard Metrics)**: Given an authenticated Requester, `GET /api/requester/dashboard` returns accurate counts and recent tickets belonging exclusively to that requester.
*   **AC-10 (Staff Dashboard Metrics)**: Given an authenticated IT Staff member, `GET /api/staff/dashboard` returns accurate system-wide status counts and the correct count of tickets assigned to the current user.

---

## 10. Definition of Done (DoD)
- [ ] Database schema updated with `ActionTaken` model, migration applied cleanly, and seed data is idempotent.
- [ ] All 6 Lab 4 documentation files created in `docs/lab-04/`.
- [ ] Backend REST API endpoints implemented with strict authorization, validation, and safe error responses.
- [ ] Status transition matrix enforced on backend with concurrency protection.
- [ ] Frontend components built adhering to the Zen Green design system:
  - Requester Dashboard with operational cards and drill-downs.
  - IT Staff Dashboard with operational metrics, quick actions, and filter links.
  - Actions Taken section on IT Staff Ticket Detail (list, create, edit).
  - Read-only Actions Taken section on Requester Ticket Detail.
  - Permitted status dropdown options in Staff Operations.
- [ ] 100% test pass rate across:
  - Server integration tests (`server/tests/lab-04/`).
  - Client component tests (`client/tests/lab-04/`).
  - End-to-end Playwright tests (`e2e/lab-04/`).
- [ ] No regression in Labs 1–3 functionality.
- [ ] Responsive design verified for Desktop (1280px+), Tablet (768px), and Mobile (375px) without horizontal scrolling.
- [ ] Pull requests created, reviewed, and merged according to the git workflow.

---

## 11. Assumptions and Decisions
1. **Advisory Resolution Comment**: Requesters signaling resolution append a comment with text: *"Requester indicated that the problem appears resolved."* This ensures clear traceability without modifying the authoritative status.
2. **Dashboard Performance**: Dashboard metrics use count queries rather than loading full ticket entities into memory.
3. **Stale Concurrency Handling**: The frontend sends the known `updatedAt` ISO string when transitioning ticket statuses. The server checks if `ticket.updatedAt.toISOString() === clientTimestamp`; if mismatched, it returns HTTP 409 Conflict with the current ticket state.
