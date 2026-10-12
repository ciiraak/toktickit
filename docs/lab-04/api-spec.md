# Lab 4 REST API Specification

## 1. Overview & Security Architecture

### Authentication & Authorization
*   **Mechanism**: JWT (JSON Web Token) transmitted via secure, HTTP-only cookie (`token`).
*   **Roles**: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
*   **RBAC Guards**:
    *   Endpoints prefixed with `/api/staff/` require `role` of `IT_STAFF` or `ADMINISTRATOR`.
    *   Requester endpoints ensure data ownership (rejection with HTTP 403 when accessing resources belonging to another user).

### Error Status Codes
*   `400 Bad Request`: Validation failure, missing required fields (e.g. `followUpNote` when `followUpRequired=true`), or invalid status transition.
*   `401 Unauthorized`: Missing or invalid session token.
*   `403 Forbidden`: Role permission mismatch or ticket ownership violation.
*   `404 Not Found`: Target ticket or action taken does not exist.
*   `409 Conflict`: Concurrency conflict (stale `updatedAt` detected).
*   `500 Internal Server Error`: Unhandled server error.

### Standard Error Response Format
```json
{
  "error": "Descriptive error message",
  "details": ["Optional list of specific field validation errors"]
}
```

---

## 2. Actions Taken Endpoints

### 2.1 GET `/api/tickets/:id/actions-taken`
Retrieves all Actions Taken for a specific ticket in chronological order.

*   **Authorization**: Authenticated user.
    *   `REQUESTER`: Permitted ONLY if the ticket belongs to them (`ticket.requesterId == user.id`). Otherwise returns HTTP `403 Forbidden`.
    *   `IT_STAFF` / `ADMINISTRATOR`: Permitted for any existing ticket.
*   **URL Parameters**:
    *   `id`: Integer ID of the ticket.
*   **Responses**:
    *   `200 OK`:
        ```json
        [
          {
            "id": 1,
            "ticketId": 12,
            "actionDateTime": "2026-10-12T10:30:00.000Z",
            "description": "Inspected access switch port 14 and tested cable integrity.",
            "result": "Cable passed fluking, but port showed CRC errors. Moved to port 15.",
            "performedById": 2,
            "performedBy": {
              "id": 2,
              "name": "Michael Chang",
              "role": "IT_STAFF"
            },
            "followUpRequired": true,
            "followUpNote": "Monitor port 15 for 24 hours to ensure CRC counter remains 0.",
            "attachmentNotes": "Refer to fluke_test_report.pdf attached to ticket.",
            "createdAt": "2026-10-12T10:35:00.000Z",
            "updatedAt": "2026-10-12T10:35:00.000Z"
          }
        ]
        ```
    *   `401 Unauthorized`: Missing auth token.
    *   `403 Forbidden`: Requester accessing another user's ticket.
    *   `404 Not Found`: Ticket does not exist.

---

### 2.2 POST `/api/staff/tickets/:id/actions-taken`
Creates a new Action Taken line on a ticket.

*   **Authorization**: `IT_STAFF` or `ADMINISTRATOR`.
*   **URL Parameters**:
    *   `id`: Integer ID of the ticket.
*   **Request Body**:
    ```json
    {
      "actionDateTime": "2026-10-12T10:30:00.000Z",
      "description": "Inspected access switch port 14 and tested cable integrity.",
      "result": "Moved to port 15 due to CRC errors.",
      "followUpRequired": true,
      "followUpNote": "Monitor port 15 for 24 hours.",
      "attachmentNotes": "fluke_test_report.pdf"
    }
    ```
    *Validation Rules*:
    *   `description`: Required, non-empty string.
    *   `result`: Required, non-empty string.
    *   `actionDateTime`: Optional ISO-8601 string (defaults to current server timestamp if omitted).
    *   `followUpRequired`: Boolean (defaults to false).
    *   `followUpNote`: Required non-empty string IF `followUpRequired` is `true`. Optional/null if `false`.
    *   `attachmentNotes`: Optional string.
    *   `performedById`: Auto-populated on the server from authenticated JWT payload.
*   **Responses**:
    *   `201 Created`: Returns created `ActionTaken` record with `performedBy` details.
    *   `400 Bad Request`: Validation failure (missing required fields, or missing `followUpNote` when `followUpRequired=true`).
    *   `401 Unauthorized`: Missing or invalid session token.
    *   `403 Forbidden`: Requester attempting to create action.
    *   `404 Not Found`: Ticket does not exist.

---

### 2.3 PATCH `/api/staff/tickets/:id/actions-taken/:actionId`
Updates an existing Action Taken record.

*   **Authorization**: `IT_STAFF` or `ADMINISTRATOR`.
*   **URL Parameters**:
    *   `id`: Integer ID of the ticket.
    *   `actionId`: Integer ID of the action taken.
*   **Request Body**:
    ```json
    {
      "description": "Updated description",
      "result": "Updated result",
      "followUpRequired": false,
      "followUpNote": null,
      "attachmentNotes": "Updated notes"
    }
    ```
*   **Responses**:
    *   `200 OK`: Returns updated `ActionTaken` record.
    *   `400 Bad Request`: Validation error (e.g. `followUpRequired=true` with empty `followUpNote`).
    *   `401 Unauthorized`: Missing auth token.
    *   `403 Forbidden`: Requester attempting update.
    *   `404 Not Found`: Ticket or Action Taken does not exist.

---

## 3. Ticket Workflow & Status Transition API

### 3.1 PATCH `/api/staff/tickets/:id`
Updates ticket operational fields, enforces permitted status transitions, and detects concurrent updates.

*   **Authorization**: `IT_STAFF` or `ADMINISTRATOR`.
*   **URL Parameters**:
    *   `id`: Integer ID of the ticket.
*   **Request Body**:
    ```json
    {
      "ownerId": 2,
      "itPriority": "HIGH",
      "currentStatus": "In Progress",
      "clientUpdatedAt": "2026-10-12T10:00:00.000Z"
    }
    ```
    *Validation & Workflow Rules*:
    *   `currentStatus`: If provided, the transition from current ticket status must be permitted by the transition matrix:
        *   `New` → `Open`, `Cancelled`
        *   `Open` → `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
        *   `In Progress` → `Waiting for Requester`, `Resolved`, `Cancelled`
        *   `Waiting for Requester` → `In Progress`, `Resolved`, `Cancelled`
        *   `Resolved` → `Closed`, `Reopened`
        *   `Closed` → `Reopened`
        *   `Reopened` → `In Progress`, `Resolved`, `Cancelled`
        *   `Cancelled` → Terminal (no transitions allowed)
    *   `clientUpdatedAt`: If provided, must match the current ticket's `updatedAt.toISOString()`. If mismatched, returns HTTP `409 Conflict`.
    *   `ownerId`: If provided, assignee must exist, be active (`isActive = true`), and possess role `IT_STAFF` or `ADMINISTRATOR`. Can be `null` to unassign.
    *   `itPriority`: Must be `LOW`, `MEDIUM`, or `HIGH` if provided.
*   **Responses**:
    *   `200 OK`:
        ```json
        {
          "id": 12,
          "ticketNumber": "TKT-2026-000012",
          "currentStatus": "In Progress",
          "itPriority": "HIGH",
          "ownerId": 2,
          "updatedAt": "2026-10-12T10:45:00.000Z"
        }
        ```
    *   `400 Bad Request`: Invalid status transition or inactive owner.
    *   `401 Unauthorized`: Missing auth token.
    *   `403 Forbidden`: Non-staff user.
    *   `404 Not Found`: Ticket not found.
    *   `409 Conflict`: Concurrency conflict (`clientUpdatedAt` does not match server state).

---

## 4. Role Dashboard Endpoints

### 4.1 GET `/api/requester/dashboard`
Returns operational metrics and recent tickets belonging exclusively to the authenticated requester.

*   **Authorization**: `REQUESTER` (or any authenticated user viewing their own personal tickets).
*   **Query Parameters**: None.
*   **Response Body**:
    *   `200 OK`:
        ```json
        {
          "metrics": {
            "totalOpen": 3,
            "waitingForRequester": 1,
            "recentlyResolved": 2,
            "totalClosed": 5
          },
          "recentTickets": [
            {
              "id": 14,
              "ticketNumber": "TKT-2026-000014",
              "summary": "Laptop battery drains quickly",
              "requestedPriority": "MEDIUM",
              "currentStatus": "In Progress",
              "createdAt": "2026-10-12T09:14:00.000Z",
              "updatedAt": "2026-10-12T11:00:00.000Z"
            }
          ]
        }
        ```
    *   *Metric Calculation Rules*:
        *   `totalOpen`: Count of tickets where `requesterId == user.id` and `currentStatus IN ('New', 'Open', 'In Progress', 'Waiting for Requester')`.
        *   `waitingForRequester`: Count where `requesterId == user.id` and `currentStatus == 'Waiting for Requester'`.
        *   `recentlyResolved`: Count where `requesterId == user.id` and `currentStatus == 'Resolved'`.
        *   `totalClosed`: Count where `requesterId == user.id` and `currentStatus IN ('Closed', 'Cancelled')`.
        *   `recentTickets`: Up to 5 most recently updated tickets owned by this requester, ordered by `updatedAt DESC`.

---

### 4.2 GET `/api/staff/dashboard`
Returns operational metrics, queue status breakdown, user-assigned workload, and urgent tickets.

*   **Authorization**: `IT_STAFF` or `ADMINISTRATOR`.
*   **Query Parameters**: None.
*   **Response Body**:
    *   `200 OK`:
        ```json
        {
          "metrics": {
            "new": 14,
            "open": 23,
            "inProgress": 18,
            "waitingForRequester": 7,
            "myAssigned": 16,
            "unassigned": 8
          },
          "urgentTickets": [
            {
              "id": 34,
              "ticketNumber": "TKT-2026-000034",
              "summary": "Core switch fan failure",
              "requestedPriority": "HIGH",
              "itPriority": "HIGH",
              "currentStatus": "Open",
              "requesterName": "Alice Walker",
              "ownerName": "Michael Chang",
              "createdAt": "2026-10-12T08:00:00.000Z",
              "updatedAt": "2026-10-12T08:15:00.000Z"
            }
          ],
          "recentTickets": [
            {
              "id": 35,
              "ticketNumber": "TKT-2026-000035",
              "summary": "VPN disconnects randomly",
              "requestedPriority": "MEDIUM",
              "itPriority": "MEDIUM",
              "currentStatus": "In Progress",
              "requesterName": "Bob Miller",
              "ownerName": null,
              "createdAt": "2026-10-12T08:30:00.000Z",
              "updatedAt": "2026-10-12T11:45:00.000Z"
            }
          ]
        }
        ```
    *   *Metric Calculation Rules*:
        *   `new`: Count where `currentStatus == 'New'`.
        *   `open`: Count where `currentStatus == 'Open'`.
        *   `inProgress`: Count where `currentStatus == 'In Progress'`.
        *   `waitingForRequester`: Count where `currentStatus == 'Waiting for Requester'`.
        *   `myAssigned`: Count where `ownerId == user.id` and `currentStatus NOT IN ('Closed', 'Cancelled')`.
        *   `unassigned`: Count where `ownerId IS NULL` and `currentStatus NOT IN ('Closed', 'Cancelled')`.
        *   `urgentTickets`: Up to 5 tickets with `itPriority == 'HIGH'` (or `requestedPriority == 'HIGH'`) and active status, ordered by `createdAt ASC`.
        *   `recentTickets`: Up to 5 most recently updated tickets, ordered by `updatedAt DESC`.
