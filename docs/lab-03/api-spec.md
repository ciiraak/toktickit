# API Specification

## Authentication & Authorization
- **Auth**: JWT via secure HTTP-only cookies.
- **Errors**: `401 Unauthorized` (no/invalid session), `403 Forbidden` (role/ownership violation), `400 Bad Request` (validation).

## Endpoints

### Auth
*   `POST /api/auth/login`: Authenticates user, returns role/status, sets cookie.
*   `POST /api/auth/logout`: Clears auth cookie.
*   `GET /api/auth/me`: Returns current user data.
*   `POST /api/auth/change-password`: Updates password, clears `requiresPasswordChange`.

### Requester (Continues Lab 2)
*   *Note: Lab 2 endpoints use session `userId`.*
*   `POST /api/tickets/:id/public-comments`: Appends public comment.

### IT Staff
*   `GET /api/staff/tickets`: Retrieves paginated, searchable, filterable queue.
*   `GET /api/staff/tickets/:id`: Retrieves ticket details including internal notes.
*   `PATCH /api/staff/tickets/:id`: Updates owner, IT Priority, status.
*   `POST /api/staff/tickets/:id/internal-notes`: Appends private internal note.

### Administrator
*   `GET /api/admin/users`: Retrieves searchable/filterable user list.
*   `POST /api/admin/users`: Creates user with role and initial password.
*   `PATCH /api/admin/users/:id`: Updates basic info/activation state.
*   `POST /api/admin/users/:id/reset-password`: Sets new initial password requiring change.
