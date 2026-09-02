# Lab 2 REST API Contract Specification

This document details the REST API endpoints, JSON request/response structures, error responses, and HTTP status codes for the TokTickIT Requester Ticketing MVP.

---

## 1. Authentication Header (Testing Login)

To mock user authentication for Lab 2:
*   All endpoints that require active requester context must parse the `x-requester-id` HTTP header.
*   The header must contain the integer ID of the selected active `Requester` (e.g. `x-requester-id: 1`).
*   If the header is missing, the API must return `401 Unauthorized`.
*   If the requester ID does not correspond to an active requester, the API must return `403 Forbidden`.

---

## 2. API Endpoints

### 2.1. Retrieve Active Requesters
Retrieve the list of active development users to populate the requester selector.

*   **URL**: `GET /api/requesters`
*   **Method**: `GET`
*   **Headers**: None
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "name": "Jennifer Anderson",
        "email": "jennifer@kmutt.ac.th"
      },
      {
        "id": 2,
        "name": "Michael Brown",
        "email": "michael@kmutt.ac.th"
      },
      {
        "id": 3,
        "name": "Sarah Johnson",
        "email": "sarah@kmutt.ac.th"
      },
      {
        "id": 4,
        "name": "David Lee",
        "email": "david@kmutt.ac.th"
      }
    ]
    ```

### 2.2. Retrieve Active Ticket Categories
Retrieve valid ticket categories to populate the category dropdown.

*   **URL**: `GET /api/categories`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    [
      { "id": 1, "name": "Account and Access" },
      { "id": 2, "name": "Hardware" },
      { "id": 3, "name": "Software" },
      { "id": 4, "name": "Network" }
    ]
    ```

### 2.3. Retrieve Active Related Systems
Retrieve valid affected systems to populate the system dropdown.

*   **URL**: `GET /api/systems`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    [
      { "id": 1, "name": "Email" },
      { "id": 2, "name": "Campus Wi-Fi" },
      { "id": 3, "name": "VPN" },
      { "id": 4, "name": "LEB2 App" },
      { "id": 5, "name": "Grade Submission App" },
      { "id": 6, "name": "Printer" },
      { "id": 7, "name": "Corporate Laptop" }
    ]
    ```

### 2.4. Create a Ticket
Submit a new ticket with metadata and optional attachments.

*   **URL**: `POST /api/tickets`
*   **Method**: `POST`
*   **Headers**:
    *   `x-requester-id: 1`
    *   `Content-Type: multipart/form-data`
*   **Multipart Fields**:
    *   `categoryId`: Number (ID of selected Category)
    *   `relatedSystemId`: Number (ID of selected Related System)
    *   `requestedPriority`: String (`LOW`, `MEDIUM`, `HIGH`)
    *   `summary`: String (10 - 100 characters)
    *   `description`: String (20 - 1000 characters)
*   **Multipart Files**:
    *   `attachments`: File list (Up to 5 files, each max 5MB. Formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`)
*   **Response (201 Created)**:
    ```json
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining much faster than usual even when idle.",
      "requestedPriority": "MEDIUM",
      "currentStatus": "New",
      "createdAt": "2026-08-26T06:15:00.000Z",
      "updatedAt": "2026-08-26T06:15:00.000Z",
      "requesterId": 1,
      "categoryId": 2,
      "relatedSystemId": 7,
      "attachments": [
        {
          "id": 15,
          "filename": "battery_screenshot.png",
          "fileSize": 254210,
          "mimeType": "image/png",
          "createdAt": "2026-08-26T06:15:00.000Z"
        }
      ]
    }
    ```
*   **Errors**:
    *   `400 Bad Request`: Validation failure (e.g. description too short, file too large, invalid format). Returns:
        ```json
        { "error": "Validation failed", "details": ["Summary must be at least 10 characters long."] }
        ```
    *   `401 Unauthorized`: `x-requester-id` header missing.
    *   `403 Forbidden`: Requester is inactive.

### 2.5. Retrieve Tickets (Dashboard)
Retrieve a paginated, searchable, and filterable list of tickets belonging strictly to the active requester.

*   **URL**: `GET /api/tickets`
*   **Method**: `GET`
*   **Headers**:
    *   `x-requester-id: 1`
*   **Query Parameters**:
    *   `search`: (Optional) String to search ticketNumber or summary (case-insensitive).
    *   `category`: (Optional) Number - filter by categoryId.
    *   `priority`: (Optional) String (`LOW`, `MEDIUM`, `HIGH`).
    *   `status`: (Optional) String (`New`, `Open`, `Pending`, `Resolved`).
    *   `sortBy`: (Optional) String (`createdAt`, `ticketNumber`, `updatedAt`). Default: `createdAt`.
    *   `sortOrder`: (Optional) String (`asc`, `desc`). Default: `desc`.
    *   `page`: (Optional) Number (1-indexed page number). Default: `1`.
    *   `limit`: (Optional) Number (items per page). Default: `10` (Max allowed: 50).
*   **Response (200 OK)**:
    ```json
    {
      "tickets": [
        {
          "id": 42,
          "ticketNumber": "TKT-2026-000042",
          "summary": "Laptop battery drains quickly",
          "requestedPriority": "MEDIUM",
          "currentStatus": "New",
          "createdAt": "2026-08-26T06:15:00.000Z",
          "updatedAt": "2026-08-26T06:15:00.000Z",
          "category": { "name": "Hardware" },
          "relatedSystem": { "name": "Corporate Laptop" }
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

### 2.6. Retrieve One Ticket
Retrieve a single ticket details including active and soft-removed attachments metadata.

*   **URL**: `GET /api/tickets/:id`
*   **Method**: `GET`
*   **Headers**:
    *   `x-requester-id: 1`
*   **Response (200 OK)**:
    ```json
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining much faster than usual.",
      "requestedPriority": "MEDIUM",
      "currentStatus": "New",
      "createdAt": "2026-08-26T06:15:00.000Z",
      "updatedAt": "2026-08-26T06:15:00.000Z",
      "requester": { "id": 1, "name": "Jennifer Anderson" },
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
      "attachments": [
        {
          "id": 15,
          "filename": "battery_screenshot.png",
          "fileSize": 254210,
          "mimeType": "image/png",
          "createdAt": "2026-08-26T06:15:00.000Z",
          "deletedAt": null,
          "deletionReason": null
        },
        {
          "id": 16,
          "filename": "wrong_report.pdf",
          "fileSize": 1048576,
          "mimeType": "application/pdf",
          "createdAt": "2026-08-26T06:15:00.000Z",
          "deletedAt": "2026-08-26T06:18:00.000Z",
          "deletionReason": "Uploaded incorrect log report"
        }
      ]
    }
    ```
*   **Errors**:
    *   `403 Forbidden`: The requested ticket does not belong to the selected active requester.
    *   `404 Not Found`: Ticket ID does not exist.

### 2.7. Upload Attachment to Existing Ticket
Upload an additional attachment to an existing ticket. Enforces attachment quantity limit (max 5 active).

*   **URL**: `POST /api/tickets/:id/attachments`
*   **Method**: `POST`
*   **Headers**:
    *   `x-requester-id: 1`
    *   `Content-Type: multipart/form-data`
*   **Multipart Files**:
    *   `attachment`: Single file (required, max 5MB. Formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`)
*   **Response (201 Created)**:
    ```json
    {
      "id": 17,
      "filename": "new_logs.pdf",
      "fileSize": 850400,
      "mimeType": "application/pdf",
      "createdAt": "2026-08-26T06:20:00.000Z"
    }
    ```
*   **Errors**:
    *   `400 Bad Request`: File type invalid, size too large, or ticket has already hit the maximum of 5 active attachments.
    *   `403 Forbidden`: Ticket is owned by another requester.
    *   `404 Not Found`: Ticket ID does not exist.

### 2.8. Download Attachment
Stream the physical file binary for download or preview.

*   **URL**: `GET /api/attachments/:id`
*   **Method**: `GET`
*   **Headers**:
    *   `x-requester-id: 1`
*   **Response (200 OK)**: Streams the file binary with appropriate headers (e.g. `Content-Type: image/png`, `Content-Disposition: attachment; filename="..."`).
*   **Errors**:
    *   `403 Forbidden`: The ticket associated with the attachment belongs to a different requester.
    *   `404 Not Found`: Attachment ID does not exist.
    *   `410 Gone`: The attachment has been soft-removed. Preview and download are blocked. Returns:
        ```json
        { "error": "Attachment has been removed", "deletedAt": "2026-08-26T06:18:00.000Z", "reason": "Uploaded incorrect log report" }
        ```

### 2.9. Soft-Remove Attachment
Mark an attachment as deleted. This is a soft-removal: metadata is retained for display, but file binary download is blocked.

*   **URL**: `DELETE /api/attachments/:id`
*   **Method**: `DELETE`
*   **Headers**:
    *   `x-requester-id: 1`
    *   `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "deletionReason": "Uploaded incorrect log report"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "message": "Attachment successfully removed",
      "id": 16,
      "deletedAt": "2026-08-26T06:18:00.000Z",
      "deletionReason": "Uploaded incorrect log report"
    }
    ```
*   **Errors**:
    *   `400 Bad Request`: `deletionReason` is missing or invalid (must be between 5 and 200 characters).
    *   `403 Forbidden`: The ticket associated with this attachment is owned by another requester.
    *   `404 Not Found`: Attachment ID does not exist.
    *   `409 Conflict`: Attachment is already soft-removed.

---

## 3. Standard Error Response Format

All API errors must return a standardized JSON format:

```json
{
  "error": "Short, human-readable error summary",
  "details": [
    "Detailed validation rule failure 1",
    "Detailed validation rule failure 2"
  ]
}
```
*   `details` is optional and is mainly populated for validation failures (HTTP 400).
