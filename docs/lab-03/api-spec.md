# Lab 3 REST API Specification

## 1. Overview & Security Architecture

### Authentication
*   **Mechanism**: JWT (JSON Web Token) transmitted via secure, HTTP-only cookie (`token`).
*   **Token Payload**: `{ id: number, role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR" }`
*   **Cookie Attributes**: `HttpOnly; SameSite=Strict; Max-Age=86400; Path=/`

### Error Status Codes
*   `400 Bad Request`: Validation failure, duplicate email, or rule violation (e.g. self-deactivation).
*   `401 Unauthorized`: Missing, expired, or invalid session token, or inactive account.
*   `403 Forbidden`: Role permission mismatch or ticket ownership violation.
*   `404 Not Found`: Target ticket, attachment, or user ID does not exist.
*   `409 Conflict`: Resource state conflict (e.g. already-removed attachment).
*   `410 Gone`: Target attachment has been soft-removed.
*   `500 Internal Server Error`: Unhandled server exception.

### Standard Error Response Format
```json
{
  "error": "Descriptive error message",
  "details": ["Optional list of specific field validation errors"]
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 POST `/api/auth/login`
Authenticates a user with email and password, setting the session cookie on success.

*   **Public endpoint** (no auth cookie required).
*   **Request Body**:
    ```json
    {
      "email": "user@kmutt.ac.th",
      "password": "Password123!"
    }
    ```
*   **Responses**:
    *   `200 OK`: Sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict`
        ```json
        {
          "id": 1,
          "name": "Jennifer Anderson",
          "email": "jennifer.anderson@kmutt.ac.th",
          "role": "REQUESTER",
          "requiresPasswordChange": false
        }
        ```
    *   `400 Bad Request`: Missing email or password.
    *   `401 Unauthorized`: Invalid credentials or inactive account.

---

### 2.2 POST `/api/auth/logout`
Clears the active session cookie.

*   **Public endpoint**.
*   **Responses**:
    *   `200 OK`: Sets `Set-Cookie: token=; Max-Age=0`
        ```json
        {
          "message": "Logged out successfully"
        }
        ```

---

### 2.3 GET `/api/auth/me`
Retrieves the profile of the currently authenticated user.

*   **Authentication**: Required.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "id": 1,
          "name": "Jennifer Anderson",
          "email": "jennifer.anderson@kmutt.ac.th",
          "role": "REQUESTER",
          "requiresPasswordChange": false,
          "isActive": true
        }
        ```
    *   `401 Unauthorized`: No active session.

---

### 2.4 POST `/api/auth/change-password`
Allows an authenticated user to change their password, clearing the `requiresPasswordChange` flag.

*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "currentPassword": "Password123!",
      "newPassword": "NewSecurePassword456!"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "message": "Password updated successfully"
        }
        ```
    *   `400 Bad Request`: Incorrect current password or missing fields.

---

## 3. Requester Endpoints (`/api/tickets`)

### 3.1 POST `/api/tickets`
Creates a new support ticket under the authenticated user's account.

*   **Authentication**: Required (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
*   **Content-Type**: `multipart/form-data`
*   **Form Fields**:
    *   `summary`: string (10–100 chars)
    *   `description`: string (20–1000 chars)
    *   `categoryId`: integer ID
    *   `relatedSystemId`: integer ID
    *   `requestedPriority`: `"LOW"` | `"MEDIUM"` | `"HIGH"`
    *   `attachments`: 0 to 5 files (JPG, PNG, WEBP, PDF, max 5MB each)
*   **Responses**:
    *   `201 Created`: Returns ticket object with generated `ticketNumber` (`TKT-YYYY-XXXXXX`).
    *   `400 Bad Request`: Validation failure.

---

### 3.2 GET `/api/tickets`
Retrieves paginated tickets owned by the authenticated requester.

*   **Authentication**: Required.
*   **Query Parameters**:
    *   `search`: string (ticket number or summary)
    *   `category`: category ID
    *   `priority`: `"LOW"` | `"MEDIUM"` | `"HIGH"`
    *   `status`: status string
    *   `sortBy`: `"createdAt"` | `"ticketNumber"` | `"updatedAt"`
    *   `sortOrder`: `"asc"` | `"desc"`
    *   `page`: integer (default: 1)
    *   `limit`: integer (default: 10)
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "tickets": [
            {
              "id": 1,
              "ticketNumber": "TKT-2026-000001",
              "summary": "Cannot connect to VPN",
              "requestedPriority": "HIGH",
              "currentStatus": "New",
              "createdAt": "2026-09-18T10:00:00.000Z",
              "updatedAt": "2026-09-18T10:00:00.000Z",
              "category": { "name": "Network" },
              "relatedSystem": { "name": "VPN" }
            }
          ],
          "pagination": {
            "totalItems": 1,
            "totalPages": 1,
            "currentPage": 1,
            "limit": 10,
            "hasNextPage": false,
            "hasPrevPage": false
          }
        }
        ```

---

### 3.3 GET `/api/tickets/:id`
Retrieves ticket details and public comments for an owned ticket.

*   **Authentication**: Required (ownership verified).
*   **Responses**:
    *   `200 OK`: Full ticket details with attachments and public comments (internal notes excluded).
    *   `403 Forbidden`: Ticket belongs to a different requester.
    *   `404 Not Found`: Ticket does not exist.

---

### 3.4 POST `/api/tickets/:id/public-comments`
Appends a public comment to an existing ticket.

*   **Authentication**: Required (Requesters may only comment on their own tickets; IT Staff/Admin can comment on all).
*   **Request Body**:
    ```json
    {
      "content": "I have restarted the VPN client but the error persists."
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "id": 1,
          "ticketId": 1,
          "authorId": 1,
          "content": "I have restarted the VPN client but the error persists.",
          "createdAt": "2026-09-18T10:30:00.000Z",
          "author": {
            "id": 1,
            "name": "Jennifer Anderson",
            "role": "REQUESTER"
          }
        }
        ```
    *   `400 Bad Request`: Empty comment content.
    *   `403 Forbidden`: Ownership mismatch.

---

## 4. IT Staff Endpoints (`/api/staff`)

*All routes in `/api/staff` require role `IT_STAFF` or `ADMINISTRATOR`.*

### 4.1 GET `/api/staff/tickets`
Retrieves a paginated, filterable, and searchable queue of all tickets in the system.

*   **Query Parameters**: `search`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `limit`.
*   **Responses**:
    *   `200 OK`: Returns `{ tickets: [...], pagination: { ... } }` including requester and owner details.
    *   `403 Forbidden`: Non-staff user.

---

### 4.2 GET `/api/staff/tickets/:id`
Retrieves full ticket detail including attachments, public comments, and private internal notes.

*   **Responses**:
    *   `200 OK`: Ticket detail object with `comments` and `notes` arrays.
    *   `404 Not Found`: Ticket not found.

---

### 4.3 PATCH `/api/staff/tickets/:id`
Updates ticket operations: assignee (`ownerId`), `itPriority`, and `currentStatus`.

*   **Request Body** (at least one field):
    ```json
    {
      "ownerId": 6,
      "itPriority": "HIGH",
      "status": "In Progress"
    }
    ```
*   **Validation Rules**:
    *   `ownerId`: null or ID of an active user with role `IT_STAFF` or `ADMINISTRATOR`.
    *   `itPriority`: `"LOW"` | `"MEDIUM"` | `"HIGH"`.
    *   `status`: `"New"` | `"Open"` | `"In Progress"` | `"Waiting for Requester"` | `"Resolved"` | `"Closed"` | `"Reopened"` | `"Cancelled"`.
*   **Responses**:
    *   `200 OK`: Returns updated ticket.
    *   `400 Bad Request`: Invalid owner, priority, or status value.

---

### 4.4 POST `/api/staff/tickets/:id/internal-notes`
Appends a private internal note to a ticket (strictly staff-only).

*   **Request Body**:
    ```json
    {
      "content": "Replaced hardware token on campus. Awaiting user verification."
    }
    ```
*   **Responses**:
    *   `201 Created`:
        ```json
        {
          "id": 1,
          "ticketId": 1,
          "authorId": 6,
          "content": "Replaced hardware token on campus. Awaiting user verification.",
          "createdAt": "2026-09-18T11:00:00.000Z",
          "author": {
            "id": 6,
            "name": "IT Staff One",
            "role": "IT_STAFF"
          }
        }
        ```
    *   `403 Forbidden`: Non-staff/non-admin user.

---

### 4.5 POST `/api/staff/tickets/:id/public-comments`
Appends a public comment from the staff side.

*   **Request Body**: `{ "content": "..." }`
*   **Responses**: `201 Created`.

---

### 4.6 GET `/api/staff/assignees`
Retrieves list of active IT Staff and Administrators available for ticket assignment.

*   **Responses**: `200 OK` with array of `{ id, name, email, role }`.

---

## 5. Administrator Endpoints (`/api/admin`)

*All routes in `/api/admin` require role `ADMINISTRATOR`.*

### 5.1 GET `/api/admin/users`
Retrieves searchable and filterable user directory.

*   **Query Parameters**:
    *   `search`: string (matches name or email)
    *   `role`: `"REQUESTER"` | `"IT_STAFF"` | `"ADMINISTRATOR"`
    *   `isActive`: `"true"` | `"false"`
    *   `sortBy`: `"name"` | `"email"` | `"role"` | `"createdAt"` | `"isActive"`
    *   `sortOrder`: `"asc"` | `"desc"`
    *   `page`: integer (default: 1)
    *   `limit`: integer (default: 10)
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "users": [
            {
              "id": 1,
              "name": "Jennifer Anderson",
              "email": "jennifer.anderson@kmutt.ac.th",
              "role": "REQUESTER",
              "requiresPasswordChange": false,
              "isActive": true,
              "createdAt": "2026-09-18T00:00:00.000Z"
            }
          ],
          "pagination": {
            "totalItems": 10,
            "totalPages": 1,
            "currentPage": 1,
            "limit": 10,
            "hasNextPage": false,
            "hasPrevPage": false
          }
        }
        ```
    *   `403 Forbidden`: Non-admin access.

---

### 5.2 POST `/api/admin/users`
Creates a new user account with assigned role and temporary password.

*   **Request Body**:
    ```json
    {
      "name": "Sarah Connor",
      "email": "sarah.c@kmutt.ac.th",
      "role": "IT_STAFF",
      "initialPassword": "TempPassword123!"
    }
    ```
*   **Business Rules**:
    *   Unique email required (**BR-09**).
    *   Hashes password with bcrypt.
    *   Sets `requiresPasswordChange = true` and `isActive = true`.
*   **Responses**:
    *   `201 Created`: Safe user object.
    *   `400 Bad Request`: Validation failure or duplicate email.

---

### 5.3 PATCH `/api/admin/users/:id`
Updates user details or activation state.

*   **Request Body**:
    ```json
    {
      "name": "Sarah Connor-Reese",
      "email": "sarah.cr@kmutt.ac.th",
      "role": "ADMINISTRATOR",
      "isActive": true
    }
    ```
*   **Business Rules**:
    *   Self-deactivation rejected (**BR-08 / AC-05**).
    *   Deactivating or demoting the last active administrator rejected (**BR-08**).
    *   Unique email validation (**BR-09**).
*   **Responses**:
    *   `200 OK`: Updated safe user object.
    *   `400 Bad Request`: Safety violation or duplicate email.
    *   `404 Not Found`: User not found.

---

### 5.4 POST `/api/admin/users/:id/reset-password`
Resets a user's password to a temporary password and flags them to change it on next login.

*   **Request Body**:
    ```json
    {
      "initialPassword": "NewTempPassword456!"
    }
    ```
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "message": "Password reset successfully. User will be prompted to change password on next login.",
          "id": 3,
          "requiresPasswordChange": true
        }
        ```
    *   `400 Bad Request`: Password too short (< 6 chars).
    *   `404 Not Found`: User not found.
