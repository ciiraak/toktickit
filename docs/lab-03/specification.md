# Sprint 3 Engineering Specification

## 1. Sprint Goal
Deliver secure authentication, server-side role-based authorization (RBAC), operational IT Staff workflows (ticket queue, assignment, priority adjustment, status advancement, and private internal notes), and Administrator user management while seamlessly migrating existing Lab 2 data.

## 2. Stakeholder Request Interpretation
The IT department requested an evolution from the temporary Development Requester identity selection into a secure multi-role IT Service Management system. The system must support three distinct user roles:
1. **Requester**: End-users who submit tickets, track their issues, post public comments, and indicate when problems appear resolved.
2. **IT Staff**: Support personnel who manage the ticket lifecycle via a searchable/filterable queue, claim ownership, adjust IT priority, transition status, and append private internal notes alongside public comments.
3. **Administrator**: System managers who manage user accounts, assign roles, activate/deactivate users, and reset initial temporary passwords.

Authentication must be secured using HTTP-only JWT cookies and bcrypt password hashing, with a mandatory first-login password change for initial or reset passwords.

---

## 3. Scope

### Included
*   **Authentication & Session Management**: Secure login, logout, current-user retrieval (`/api/auth/me`), and password change.
*   **Mandatory First-Login Password Change**: Enforcing password change before granting application access for users flagged with `requiresPasswordChange = true`.
*   **Server-Side RBAC**: Authorization middleware verifying roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) on all protected endpoints.
*   **Data Migration**: Database schema expansion with `User`, `Role`, `Comment`, `Note`, and ticket fields (`ownerId`, `itPriority`, `status`), with migration of Lab 2 requesters into user accounts.
*   **Requester Enhancements**: Authenticated identity ownership enforcement, public commenting, and "Problem Appears Resolved" feedback.
*   **IT Staff Queue & Operations**: Searchable, filterable, paginated ticket queue; ticket detail screen with owner assignment, IT priority override, status transitions, public comments, and isolated private internal notes.
*   **Administrator User Management**: Directory view with search and role/status filtering, user creation with role and initial password, user information/activation editing, and temporary password reset.

### Excluded
*   External email/SMTP integration and notification services.
*   Public self-registration (user provisioning is managed by Administrators).
*   SLA automation timers and automated escalations.
*   Bulk batch operations on tickets or users.
*   Hard user deletion (users are soft-deactivated to preserve historical ticket audit trails).

---

## 4. Functional Requirements

*   **FR-01 (Authentication)**: Users can securely authenticate with their email and password. A successful login sets an HTTP-only JWT cookie and returns safe user data (excluding password hashes).
*   **FR-02 (Password Management & Interstitial)**: Users with `requiresPasswordChange = true` are presented with a mandatory interstitial screen that blocks normal access until a new password is set.
*   **FR-03 (Role-Based Navigation & Shell)**: The application shell displays the current user's name, role badge, and role-appropriate navigation tabs (Requesters see My Tickets/Create Ticket; IT Staff see IT Staff Queue; Administrators see User Management).
*   **FR-04 (Requester Workflows)**: Requesters submit tickets, track submitted tickets, upload/manage attachments, post public comments, and indicate that their problem appears resolved.
*   **FR-05 (IT Staff Queue)**: IT Staff can search tickets by ticket number or summary, filter by status and priority, sort, and paginate through all tickets in the system.
*   **FR-06 (IT Staff Operations & Internal Notes)**: IT Staff can claim/reassign tickets to active IT Staff or Administrators, update IT Priority (`LOW`, `MEDIUM`, `HIGH`), transition status, post public comments, and append private internal notes.
*   **FR-07 (Administrator User Management)**: Administrators can view a searchable and filterable directory of users, create new user accounts with designated roles and temporary passwords, edit user profiles/active statuses, and reset user passwords.

---

## 5. Business Rules (BR)

*   **BR-01 (Active User Authentication)**: Only active users (`isActive = true`) with valid credentials can authenticate. Inactive or deleted accounts receive a generic authentication failure.
*   **BR-02 (Mandatory First-Login Password Change)**: If a user account has `requiresPasswordChange = true`, all normal application access is blocked until they submit a new password that differs from the temporary password and is at least 6 characters long.
*   **BR-03 (Authenticated Requester Ownership)**: Ticket creation and requester access endpoints derive user identity directly from the authenticated session (JWT token payload). Client-provided `requesterId` parameters are ignored in favor of the authenticated context.
*   **BR-04 (Comment vs. Internal Note Isolation)**: Public Comments are visible to all authenticated roles (Requester, IT Staff, Admin). Internal Notes are strictly confidential to IT Staff and Administrators; any Requester attempt to view or post internal notes returns HTTP `403 Forbidden`.
*   **BR-05 (Problem Resolution Indication)**: Requesters can indicate that their problem appears resolved (posting an automated public comment), but only IT Staff and Administrators have permission to formally change the ticket status to `Resolved` or `Closed`.
*   **BR-06 (Ticket Ownership Assignment)**: A ticket may have 0 or 1 Ticket Owner. If assigned, the owner must be an active user with the role `IT_STAFF` or `ADMINISTRATOR`.
*   **BR-07 (IT Priority Hierarchy)**: IT Priority defaults to the Requested Priority upon ticket creation. Only IT Staff and Administrators can modify IT Priority.
*   **BR-08 (Administrator Safety Guards)**: An Administrator cannot deactivate their own account (`isActive = false`). Furthermore, the system prevents deactivating or demoting the last active Administrator in the system.
*   **BR-09 (Unique Email Constraint)**: Every user account must have a globally unique email address. Creating or updating a user with an existing email address is rejected with HTTP `400 Bad Request`.
*   **BR-10 (Append-Only Comments & Notes)**: Public Comments and Internal Notes are append-only. Once submitted, they cannot be modified or deleted to preserve an immutable audit trail.

---

## 6. UI Specification Summary
The UI adheres to the **Zen Green** design system (`docs/lab-03/ui-spec.md`):
*   **Login & Password Change**: Centered card with email/password inputs, clear error banners, and full-screen blocking for mandatory password changes.
*   **App Shell**: Persistent header with TokTickIT branding, role-scoped navigation tabs, user badge with role indicator, and Sign Out action.
*   **IT Staff Queue**: Comprehensive data table with search, priority/status filter dropdowns, and responsive layout.
*   **IT Staff Detail**: Two-column layout separating metadata/operations (owner, priority, status) from conversation streams (Public Comments vs. Amber-styled Internal Notes).
*   **Requester Detail**: Clean ticket metadata view with public comment stream and "Problem Appears Resolved" feedback button.
*   **Admin User Directory**: Searchable table with role badges, status toggles, user creation modal, edit modal, and password reset modal.

---

## 7. Data Changes & Migration

*   **User Model**: Added fields `name`, `email` (unique), `passwordHash`, `role` (`REQUESTER` | `IT_STAFF` | `ADMINISTRATOR`), `requiresPasswordChange` (boolean), `isActive` (boolean), and `createdAt`.
*   **Ticket Model**: Added foreign key `ownerId` referencing `User` (`@relation("TicketOwner")`), `itPriority` (string nullable), `currentStatus` (string default "New").
*   **Comment Model**: Stores `ticketId`, `authorId`, `content`, `createdAt` for public discussion.
*   **Note Model**: Stores `ticketId`, `authorId`, `content`, `createdAt` for private staff discussion.
*   **Data Migration**: Converted all Lab 2 requesters into `User` records with role `REQUESTER`, default initial password `Password123!`, and `requiresPasswordChange = true`. Existing tickets were preserved and linked.

---

## 8. API Contract Summary
All protected endpoints use HTTP-only JWT cookies (`token`). See `docs/lab-03/api-spec.md` for full schema details:
*   `POST /api/auth/login`: Authenticates credentials, sets auth cookie, returns safe user.
*   `POST /api/auth/logout`: Clears auth cookie.
*   `GET /api/auth/me`: Returns active authenticated user profile.
*   `POST /api/auth/change-password`: Updates password and clears `requiresPasswordChange`.
*   `POST /api/tickets/:id/public-comments`: Adds a public comment to a ticket.
*   `GET /api/staff/tickets`: Retrieves paginated, filterable, and searchable staff ticket queue.
*   `GET /api/staff/tickets/:id`: Retrieves complete ticket detail including internal notes.
*   `PATCH /api/staff/tickets/:id`: Updates owner, IT Priority, and status.
*   `POST /api/staff/tickets/:id/internal-notes`: Appends private internal note.
*   `GET /api/admin/users`: Retrieves searchable and filterable user directory.
*   `POST /api/admin/users`: Creates a new user with role and temporary password.
*   `PATCH /api/admin/users/:id`: Updates user basic info and activation state.
*   `POST /api/admin/users/:id/reset-password`: Resets user initial password.

---

## 9. Acceptance Criteria

*   **AC-01**: Valid login establishes authenticated access and sets the user's role.
*   **AC-02**: Users with initial/temporary passwords are required to change their password before accessing the app.
*   **AC-03**: Requester API calls ignore client `requesterId` in favor of authenticated context.
*   **AC-04**: Requester attempts to access Internal Notes return HTTP `403 Forbidden`.
*   **AC-05**: Administrator self-deactivation request is rejected with HTTP `400 Bad Request`.
*   **AC-06**: IT Staff can claim tickets, adjust status/priority, and append internal notes.

---

## 10. Definition of Done
- [x] Authentication, roles, and database migration implemented.
- [x] IT Staff and Administrator workflows fully functional.
- [x] Spec DD, Test DD (with 55 passing server tests and 42 passing client tests), and E2E Playwright test suite completed.
- [x] AI reflection and peer review documentation completed.

---

## 11. Assumptions and Decisions
*   **Authentication**: Secure HTTP-only cookies containing signed JWT tokens with 1-day expiration.
*   **Passwords**: Cryptographically hashed using bcrypt (10 salt rounds).
*   **Authorization**: Middleware guards verifying authenticated user roles on Express routers (`requireAuth`, `requireRole`).
