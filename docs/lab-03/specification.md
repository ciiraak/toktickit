# Sprint 3 Engineering Specification

## 1. Sprint Goal
Deliver secure authentication, role-based authorization, operational IT Staff workflows, and minimalist Administrator user management.

## 2. Stakeholder Request
Replace temporary requester selection with secure login. Introduce roles (Requester, IT Staff, Administrator). IT Staff get a professional queue and ticket operations. Administrators manage users.

## 3. Scope
**Included:** Login/logout, first-login password change, server-side RBAC, IT Staff Queue/Detail, Public/Internal Comments, minimalist user management, data migration.
**Excluded:** Email features, self-registration, "Actions Taken", SLAs, dashboards, bulk operations, user deletion.

## 4. Functional Requirements
*   **FR-01**: Secure login, logout, and current-user retrieval.
*   **FR-02**: Mandatory first-login password change.
*   **FR-03**: Role-based navigation and server-side authorization.
*   **FR-04**: Requesters manage tickets and post Public Comments.
*   **FR-05**: IT Staff use a searchable, paginated Ticket Queue.
*   **FR-06**: IT Staff manage tickets (assign, priority, status, Public/Internal notes).
*   **FR-07**: Administrators manage users (list, search, create, edit, change initial password).

## 5. Business Rules (BR)
*   **BR-01**: Only active users with valid credentials may authenticate.
*   **BR-02**: Pending password change blocks normal application access.
*   **BR-03**: Authenticated identity determines Requester ownership.
*   **BR-04**: Public Comments visible to all; Internal Notes only to IT Staff/Admin.
*   **BR-05**: Requesters can indicate problem resolved, but cannot set status to Resolved/Closed.
*   **BR-06**: Tickets have 0 or 1 Ticket Owner (active IT Staff/Admin).
*   **BR-07**: IT Priority defaults to Requested Priority; changeable only by Staff/Admin.
*   **BR-08**: Administrators cannot deactivate themselves or remove the last active Admin.
*   **BR-09**: No duplicate email addresses.
*   **BR-10**: Comments/Notes are append-only.

## 6. UI Specification Summary
Reuses Zen Green design. See `ui-spec.md`.

## 7. Data Changes
*   **Models**: User (role, active/password flags), Comment, Note.
*   **Fields**: Ticket gets `ownerId`, `itPriority`, `status`.
*   **Migration**: Lab 2 Dev Requesters become User accounts with initial passwords. Tickets preserved.
*   **Seeds**: Active/inactive users for each role.

## 8. API Contract
REST API with JWT authentication. See `api-spec.md`.

## 9. Acceptance Criteria
*   **AC-01**: Valid login establishes authenticated access with role.
*   **AC-02**: Initial password login forces password change before access.
*   **AC-03**: Requester API calls ignore client `requesterId` in favor of auth context.
*   **AC-04**: Requester requests to Internal Notes return 403 Forbidden.
*   **AC-05**: Admin self-deactivation request is rejected.
*   **AC-06**: IT Staff can successfully append Internal Notes.

## 10. Definition of Done
- [ ] Authentication, roles, and migration implemented.
- [ ] IT Staff and Admin workflows functional.
- [ ] Spec DD, Test DD (with passing automated tests), and AI reflection completed.

## 11. Assumptions and Decisions
*   **Auth**: HTTP-only cookies with JWT.
*   **Passwords**: Bcrypt hashing.
