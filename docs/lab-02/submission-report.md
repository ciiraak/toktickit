# Lab 2 Submission Report

## Answer Part 1: Git Use with Engineering Workflow

**1. Commit History Screenshot:**
![Git History Placeholder](path/to/git-history-screenshot.png)

**2. GitHub Project Kanban Screenshot:**
![Kanban Placeholder](path/to/kanban-screenshot.png)

**3. Rendered reviewer.md:**

# Lab 2 — Peer Review Record

**Author:** <your name> — <student id> — GitHub: @ciiraak  
**Peer reviewer:** <partner name> — <student id> — GitHub: @<username>  

## Pull Requests I authored (reviewed by my partner)

| PR # | Branch Name | Reviewer Verdict / Comments |
| :--- | :--- | :--- |
| #16 | `feature/5-sprint-specifications` | Approved — Sprint specification, UI spec, API spec, and test plan documents reviewed and merged. |
| #17 | `feature/6-requester-context` | Approved — Requester selection UI, localStorage persistence, and context provider reviewed. |
| #18 | `feature/7-ticket-creation` | Approved — Create Ticket form with validation, file upload, and API integration reviewed. |
| #19 | `feature/8-my-tickets` | Approved — My Tickets dashboard with search, category/priority/status filtering, pagination, and responsive table/card views reviewed. |
| #21 | `feature/9-ticket-details-attachments` | Approved — Ticket detail screen, attachment upload/download/soft-removal endpoints, and E2E test coverage reviewed. |

*   **Reviewer comment received**: `<to be filled after peer review>`
*   **How I responded**: `<to be filled after peer review>`

## Pull Requests I reviewed for my partner

| PR # | Branch Name | My Verdict / Comments |
| :--- | :--- | :--- |
| | | `<to be filled after peer review>` |

*   **My review comment**: `<to be filled after peer review>`
*   **Partner's response**: `<to be filled after peer review>`


**4. README and .gitignore Evidence:**

**README.md**
`markdown
# TokTickIT

**TokTickIT** is an IT Service Desk application built with a **React + Vite** frontend and an **Express + Prisma** backend, backed by **PostgreSQL**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up PostgreSQL](#2-set-up-postgresql)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Database Migrations](#5-run-database-migrations)
  - [6. Seed the Database](#6-seed-the-database)
  - [7. Start the Server](#7-start-the-server)
  - [8. Start the Client](#8-start-the-client)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure the following tools are installed on your machine before proceeding:

| Tool           | Minimum Version | Download                                      |
|----------------|-----------------|-----------------------------------------------|
| **Node.js**    | 18+             | [nodejs.org](https://nodejs.org/)             |
| **npm**        | 9+              | Comes with Node.js                            |
| **PostgreSQL** | 14+             | [postgresql.org](https://www.postgresql.org/) |

> **Tip:** You can verify your installations by running:
> ```bash
> node -v
> npm -v
> psql --version
> ```

---

## Repository Structure

```
toktickit/
├── client/           # React + Vite frontend (port 5173)
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── server/           # Express + Prisma backend (port 3000)
│   ├── src/
│   ├── tests/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── .env
│   └── package.json
├── docs/
└── README.md
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd toktickit
```

---

### 2. Set Up PostgreSQL

Create a PostgreSQL database and user for the project. Open a PostgreSQL shell (`psql`) and run:

```sql
CREATE USER toktickit WITH PASSWORD 'toktickit';
CREATE DATABASE toktickit OWNER toktickit;
GRANT ALL PRIVILEGES ON DATABASE toktickit TO toktickit;
```

> **Note:** The default credentials above match the connection string in `server/.env`. Feel free to change them, but make sure the `.env` file matches.

---

### 3. Configure Environment Variables

#### Server

The server ships with a pre-configured `.env` file at `server/.env`. Verify it matches your PostgreSQL setup:

```dotenv
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

> **Important:** Do **not** commit your `.env` file to version control. It is already listed in `.gitignore`.

#### Client

Copy the example file to create your local config:

```bash
cd client
cp .env.example .env
```

The default value points to the local API server:

```dotenv
VITE_API_URL="http://localhost:3000"
```

---

### 4. Install Dependencies

From the **project root**, install dependencies for both the server and the client:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 5. Run Database Migrations

Navigate to the server directory and apply the Prisma migrations to create the database tables:

```bash
cd server
npx prisma migrate dev
```

This will:
- Apply all pending migrations in `prisma/migrations/`
- Generate the Prisma Client

> If prompted for a migration name, you can enter any descriptive name (e.g., `init`).

---

### 6. Seed the Database

Populate the database with initial data:

```bash
cd server
npm run prisma:seed
```

This runs the seed script at `prisma/seed.ts`, which inserts the default IT request categories.

---

### 7. Start the Server

```bash
cd server
npm run dev
```

The API server will start at **http://localhost:3000**. You should see:

```
TokTickIT API listening on http://localhost:3000
```

You can verify the server is running by visiting the health-check endpoint:

```bash
curl http://localhost:3000/api/health
```

---

### 8. Start the Client

Open a **new terminal** and run:

```bash
cd client
npm run dev
```

The Vite dev server will start at **http://localhost:5173**. Open this URL in your browser to see the TokTickIT frontend.

---

## Running Tests

Both the server and client have their own test suites using **Vitest**.

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on port 5432 | Make sure PostgreSQL is running and accepting connections on port 5432. |
| Prisma migration fails | Verify `DATABASE_URL` in `server/.env` matches your PostgreSQL credentials and that the database exists. |
| Client shows network errors | Ensure the server is running on port 3000 and `VITE_API_URL` in `client/.env` is set to `http://localhost:3000`. |
| `npx prisma generate` errors | Run `npm install` in the `server/` directory first to ensure `@prisma/client` is installed. |
| Port already in use | Kill the process using the port or change `PORT` in `server/.env` / `server.port` in `client/vite.config.ts`. |
`

**.gitignore**
`	ext
# dependencies
node_modules/
# env & secrets
.env
*.env
!.env.example
# build output
dist/
build/
# prisma
server/prisma/*.db
# logs & OS
*.log
.DS_Store
# uploaded files (keep folder, ignore contents)
server/uploads/*
!server/uploads/.gitkeep
client/src/**/*.js
client/src/*.js


`

**5. Directory Structure Screenshot:**
![Directory Structure Placeholder](path/to/directory-structure.png)

## Answer Part 2: Spec DD

**Link:** [specification.md](./specification.md)

**Screenshot proving it existed before implementation PRs:**
![Spec Evidence Placeholder](path/to/spec-git-history.png)

**Rendered specification.md:**

# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Build and deliver a professional, responsive, and robust Requester-facing IT support ticketing MVP using the **Zen Green** design system. This sprint establishes a temporary Development Requester identity selection to simulate a multi-user environment, allows requesters to submit and track support tickets with multiple attachments (supporting search, sorting, filtering, and pagination), inspect ticket details, and manage attachment lifecycles with soft-removal rules.

## 2. Stakeholder Request Interpretation
The IT department needs a self-service web application for end-users (Requesters) to report issues. The system must allow users to select their category, affected system, priority, describe their problem, and upload attachments.
Requesters must be able to view their own tickets in a clean dashboard, search and filter them, and open a ticket detail screen. To simulate multi-user behavior before real authentication is added, we must provide a temporary "Development Requester Selector". We must enforce strict ownership (preventing one requester from viewing another's tickets) and implement a soft-removal mechanism for attachments with a stated reason.

## 3. Scope

### Included
*   **Development Requester Selector**: A mock login screen to select one of the active seeded requesters to set the session context.
*   **Create Ticket Form**: Capture category, related system, priority, summary, description, and up to 5 attachments.
*   **My Tickets Dashboard**: Search, filter by category/priority/status, sort, and paginate through owned tickets.
*   **Ticket Detail Screen**: Read-only display of ticket fields, historical attachments, and attachment upload/download/soft-removal.
*   **Attachment Management**: Support uploading JPG/JPEG, PNG, WEBP, and PDF files up to 5MB, downloading active files, and soft-removing files with a stated reason.
*   **Strict Access Control**: Verify requester ownership on all ticket-related backend endpoints and frontend views.

### Excluded
*   **Authentication & Security**: Passwords, encryption, sessions/cookies, token management, roles, and real RBAC (deferred to Lab 3).
*   **IT Staff Workflows**: Helpdesk dashboards, ticket assignment, updating IT priority, or changing status (tickets remain `New` unless advanced in future labs).
*   **Collaboration & Communication**: Ticket comments, internal notes, notifications, or actions logs. (Note: Only the static layout is rendered as a placeholder where required, but no interactive comment submission is implemented).
*   **Admin Dashboard**: Creating categories, systems, or managing user accounts.

---

## 4. Functional Requirements

*   **FR-01**: **Requester Selection**: The app must prompt the user to choose an active Development Requester before entering any ticketing screens.
*   **FR-02**: **App Header & Shell**: The app shell must display the selected Requester's name, their avatar/initials, and a "Change Requester" action to switch contexts.
*   **FR-03**: **Ticket Submission**: Requesters can fill out a form with a summary, description, priority, category, related system, and supporting files, then submit it.
*   **FR-04**: **Unique Ticket Numbering**: The system must generate a unique, formatted ticket number for each newly created ticket.
*   **FR-05**: **My Tickets Listing**: Requesters must be able to view their submitted tickets in a paginated list showing the ticket number, date, summary, category, priority, status, and last updated time.
*   **FR-06**: **Search and Filtering**: Requesters can search their tickets by ticket number or summary, and filter by Category, Priority, and Status.
*   **FR-07**: **Sorting**: The ticket list can be sorted by creation date, ticket number, or last updated date in ascending/descending order.
*   **FR-08**: **Ticket Details**: Requesters can open a ticket from their list to see a read-only details view of its metadata, description, and list of attachments.
*   **FR-09**: **Attachment Upload (Post-Creation)**: Requesters can add new permitted attachments to an existing ticket from the Ticket Detail view.
*   **FR-10**: **Attachment Soft Removal**: Requesters can remove an attachment they uploaded by providing a mandatory removal reason.

---

## 5. Business Rules (BR)

*   **BR-01 (Ticket Number Format)**: The official Ticket Number is generated by the backend and must be unique. The format is `TKT-YYYY-XXXXXX` where `YYYY` is the current calendar year (e.g. 2026) and `XXXXXX` is a zero-padded, sequential integer starting at `000001` (e.g. `TKT-2026-000001`).
*   **BR-02 (Initial Ticket Status)**: A new ticket always begins with a `Current Status` of `New`.
*   **BR-03 (Development Login)**: Lab 2 uses a Development Requester selector instead of login. The selected identity is stored in frontend storage (e.g., `localStorage`) for testing. Changing the identity must immediately refresh the app and reload user-specific data.
*   **BR-04 (Strict Ownership)**: Requesters can only access, search, view, download, or edit tickets and attachments where they are the designated owner (`requesterId` matches the session). The backend must validate the requester ID passed in headers/requests against the database, throwing HTTP `403 Forbidden` if there is a mismatch.
*   **BR-05 (Field Validation)**:
    *   **Ticket Summary**: Required, string, length 10 to 100 characters. Trim leading/trailing whitespace.
    *   **Description**: Required, string, length 20 to 1000 characters. Trim leading/trailing whitespace.
    *   **Category**: Required, must refer to an existing active Category ID in the database.
    *   **Related System**: Required, must refer to an existing active Related System ID in the database.
    *   **Requested Priority**: Required, must be one of: `LOW`, `MEDIUM`, `HIGH`. Default is `MEDIUM`.
*   **BR-06 (Attachment Formats)**: The only allowed mime types are: `image/jpeg` (JPG/JPEG), `image/png` (PNG), `image/webp` (WEBP), and `application/pdf` (PDF).
*   **BR-07 (Attachment File Size)**: The maximum file size per attachment is 5 MB (5,242,880 bytes). Files exceeding this limit must be rejected.
*   **BR-08 (Attachment Count Limit)**: A single ticket can have a maximum of 5 *active* (non-removed) attachments.
*   **BR-09 (Soft Removal)**: Attachments are never physically deleted from storage or database during a removal. Instead, they are soft-removed by setting `deletedAt = now()` and recording a mandatory `deletionReason` of 5 to 200 characters.
*   **BR-10 (Removed File Isolation)**: Soft-removed attachments remain listed in the ticket details for audit/metadata visibility (displaying a "Removed" badge and the removal reason), but the file's download, preview, and API retrieval endpoint must be completely blocked (returning HTTP `410 Gone` or `403 Forbidden`).
*   **BR-11 (Active Requesters Only)**: Only active Development Requesters can be selected or switch contexts. Inactive requesters must be seeded in the database to test that they are excluded from the dropdown and rejected if they attempt to call the API.
*   **BR-12 (Empty/No-results UI)**: If a requester has no tickets, the screen must display an empty-state card. If search/filters return no results, a "No matching tickets found" message must be shown.
*   **BR-13 (Duplicate Submission Prevention)**: While a ticket submission or attachment upload request is pending, the submit button must enter a disabled, busy loading state to prevent double-clicks and duplicate API calls.
*   **BR-14 (Atomic Creation Transaction)**: When submitting a new ticket, the ticket and all selected attachments are processed. If any attachment fails validation or upload, the entire operation is rolled back (database transaction aborts) and no partial ticket is saved, returning a descriptive validation error to the user so they can adjust files.
*   **BR-15 (API Error Handling)**: If any backend API call fails (network error, database outage), the frontend must display a localized, clean error callout message directly beneath the relevant form action, preserving the user's form inputs.

---

## 6. UI Specification Summary
The application follows the **Zen Green Theme** styling guide documented in [`ui-spec.md`](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/toktickit/docs/lab-02/ui-spec.md).
*   **Application Shell**: Top navigation bar with the TokTickIT logo, navigation tabs ("My Tickets", "Create Ticket"), and the active user profile widget showing the selected requester's name.
*   **Requester Selector**: Centered dialog card displaying a dropdown list of active requesters, an informational banner, and a "Continue" button.
*   **Create Ticket Page**: Form with inputs aligned vertically or in a two-column grid. Fields are marked with a red asterisk `*` when required. Responsive dropzone or file selector for attachments.
*   **My Tickets Page**: A searchable, filterable grid/table displaying ticket status, priority, number, summary, category, date, and owner. In mobile screens, this table collapses into readable cards.
*   **Ticket Detail Page**: Header bar with a back button, a grid of read-only ticket fields, and a dedicated card displaying active and soft-removed attachments.

---

## 7. Data Changes (Database Schema)

We will increment our Prisma PostgreSQL schema with the following models and relationships:

```mermaid
erDiagram
    Requester ||--o{ Ticket : "owns"
    Category ||--o{ Ticket : "categorizes"
    RelatedSystem ||--o{ Ticket : "targets"
    Ticket ||--o{ Attachment : "contains"

    Requester {
        Int id PK
        String email UK
        String name
        Boolean isActive
        DateTime createdAt
    }

    Category {
        Int id PK
        String name UK
        DateTime createdAt
    }

    RelatedSystem {
        Int id PK
        String name UK
        Boolean isActive
        DateTime createdAt
    }

    Ticket {
        Int id PK
        String ticketNumber UK
        Int requesterId FK
        Int categoryId FK
        Int relatedSystemId FK
        String summary
        String description
        String requestedPriority "LOW/MEDIUM/HIGH"
        String currentStatus "New/Open/Pending/Resolved"
        DateTime createdAt
        DateTime updatedAt
    }

    Attachment {
        Int id PK
        Int ticketId FK
        String filename
        String filePath
        String mimeType
        Int fileSize
        DateTime createdAt
        DateTime deletedAt "nullable"
        String deletionReason "nullable"
    }
```

### Database Migration & Seed Plan
1.  **Migration**: Create database tables using Prisma migration `npx prisma migrate dev --name add_ticketing_models`.
2.  **Seeding (`prisma/seed.ts`)**:
    *   **Categories**: "Account and Access", "Hardware", "Software", and "Network".
    *   **Related Systems**: "Email", "Campus Wi-Fi", "VPN", "LEB2 App", "Grade Submission App", "Printer", and "Corporate Laptop" (all active).
    *   **Requesters**:
        *   Active: "Jennifer Anderson" (jennifer@kmutt.ac.th), "Michael Brown" (michael@kmutt.ac.th), "Sarah Johnson" (sarah@kmutt.ac.th), "David Lee" (david@kmutt.ac.th).
        *   Inactive: "John Doe" (john.doe@kmutt.ac.th) (must not appear in selection).

---

## 8. API Contract Summary
All endpoints are prefix-versioned at `/api` and return standardized JSON payloads. Full schemas, query parameters, error responses, and HTTP status codes are documented in [`api-spec.md`](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/toktickit/docs/lab-02/api-spec.md).

Endpoints summary:
*   `GET /api/requesters`: Returns active requesters.
*   `GET /api/categories`: Returns categories list.
*   `GET /api/systems`: Returns active related systems.
*   `POST /api/tickets`: Submits a new ticket with attachments (multi-part form data).
*   `GET /api/tickets`: Paginated, searchable, filterable list of tickets for the active requester.
*   `GET /api/tickets/:id`: Retrieves a single ticket detail (enforces ownership).
*   `POST /api/tickets/:id/attachments`: Uploads an attachment to an existing ticket.
*   `GET /api/attachments/:id`: Downloads an active attachment file.
*   `DELETE /api/attachments/:id`: Soft-removes an attachment.

---

## 9. Acceptance Criteria (AC)

*   **AC-01 (Successful Submission)**:
    *   **Given**: A valid selected Requester, category, related system, priority, and valid summary/description.
    *   **When**: The requester submits the ticket form.
    *   **Then**: The ticket is saved in the database with status `New`, a unique ticket number starting with `TKT-`, and a success screen is displayed.
*   **AC-02 (Unauthorized Access)**:
    *   **Given**: No Development Requester is selected.
    *   **When**: The user attempts to visit the dashboard or ticket details.
    *   **Then**: The application intercepts the navigation and redirects the user to the Development Requester Selection screen.
*   **AC-03 (Cross-Requester Security)**:
    *   **Given**: Requester A is selected.
    *   **When**: Requester A attempts to fetch or view a ticket belonging to Requester B.
    *   **Then**: The API returns HTTP `403 Forbidden` and the frontend shows an access denied error.
*   **AC-04 (My Tickets Filters & Pagination)**:
    *   **Given**: A list of tickets for the active requester.
    *   **When**: The requester selects a category filter or types a search query.
    *   **Then**: The list instantly filters matching items, adjusts pagination counts, and displays the correct subset.
*   **AC-05 (Attachment Constraints)**:
    *   **Given**: A file of type `.exe` or a file size of `6 MB`.
    *   **When**: The requester attempts to upload it.
    *   **Then**: The upload is blocked on the frontend with a clear validation message, and the API rejects the request with HTTP `400 Bad Request`.
*   **AC-06 (Attachment Soft Removal)**:
    *   **Given**: An active attachment on a ticket.
    *   **When**: The ticket owner clicks "Remove", provides a reason of "No longer needed", and confirms.
    *   **Then**: The attachment record is updated with `deletedAt` and `deletionReason`, it appears as "Removed" in the UI, and downloading the file is disabled/blocked.

---

## 10. Definition of Done (DoD)

- [ ] All specified functional requirements and business rules are fully implemented.
- [ ] Prisma schema is migrated and database is successfully seeded.
- [ ] Unit, API integration, UI component, and Playwright end-to-end tests are written, run, and pass with 100% green status.
- [ ] No tests are skipped, bypassed, or commented out.
- [ ] Application styling matches the Zen Green Theme specifications on desktop, tablet, and mobile layouts.
- [ ] Review documentation (`reviewer.md`) and AI reflection (`ai-use.md`) are filled in with accurate project data.
- [ ] Clean build passes for both backend (`npm run build`) and frontend (`npm run build`).

---

## 11. Assumptions and Decisions

1.  **Local Storage for Mock Session**: Since real authentication is excluded, the selected requester's database ID will be stored in local storage under `toktickit_requester_id` and included as a custom header `x-requester-id` on every API request.
2.  **Local File System Storage**: Uploaded files will be stored in a local directory (`server/uploads/`) on the server. The filename will be stored in the database with a unique timestamp prefix to prevent file collisions.
3.  **Static Comments Display**: To match the stakeholder's visual mockup, the UI detail screen will display static mock comments, but no comment submission or comment-saving database structure will be implemented.


## Answer Part 3: Test DD and Traceability

**Link:** [tests.md](./tests.md)

**Rendered tests.md (Includes passing output):**

# Lab 2 Test Plan and Results

This document defines the testing strategy, planned tests, and execution commands to verify all functional requirements and business rules for the Lab 2 sprint.

---

## 1. Test Strategy

We apply **Test-Driven Development (TDD)** and **Spec-Driven Development (Spec DD)** to verify correctness across multiple levels:
*   **Unit Tests**: Verify isolated backend logic (e.g. ticket number formatting, file extension check, file size helper).
*   **API Integration Tests**: Verify HTTP status codes, payload shapes, database state updates, validation rules, and ownership checks via Supertest.
*   **UI Component Tests**: Verify individual React components (e.g. Requester Selector, Create Ticket Form, My Tickets Dashboard, badges, and error boundary states) using Vitest and React Testing Library.
*   **End-to-End (E2E) Tests**: Verify complete multi-step user journeys (such as choosing a requester, submitting a ticket with files, dashboard filtering, and soft removing an attachment) using Playwright.

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-01 | Ticket number generator formatting | Returns string in format `TKT-YYYY-XXXXXX` (e.g., `TKT-2026-000001`). | `server/tests/lab-02/helpers.test.ts` | Pass |
| **UNIT-02** | Unit | BR-06, BR-07 | File validation helper logic | Accepts JPEG, PNG, WEBP, PDF under 5MB; rejects others. | `server/tests/lab-02/helpers.test.ts` | Pass |
| **API-01** | API | AC-01, BR-02 | Create valid ticket with attachment | Returns 201; ticket saved with status `New`, generated Ticket Number, file on disk. | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-02** | API | BR-05 | Ticket validation limits | Returns 400 Bad Request if summary < 10 chars or description < 20 chars. | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-03** | API | AC-03, BR-04 | Ticket ownership verification | Returns 403 Forbidden when requesting details of a ticket owned by another user. | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| **API-04** | API | AC-04 | Search, filtering, and paging | Returns paginated subset of tickets matching search queries and category filters. | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| **API-05** | API | BR-08 | Attachment quantity limit | Returns 400 Bad Request when trying to add a 6th active attachment to a ticket. | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-06** | API | BR-09, BR-10 | Soft remove attachment with reason | Returns 200; `deletedAt` and reason saved; download endpoint blocked with 410 Gone. | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **UI-01** | UI | AC-02 | Requester selector redirection | Redirects to `/select-requester` if no requester is stored in local storage. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-02** | UI | BR-15 | Form submit busy state | Submitting the form disables the Submit button and renders a loading spinner. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-03** | UI | BR-05 | Frontend input validation | Displays red asterisk markers and inline validation errors when fields are empty. | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-04** | UI | AC-04, BR-12 | Ticket list and empty states | Renders empty state card if ticket list is empty, or table headers if populated. | `client/src/tests/lab-02/MyTickets.test.tsx` | Pass |
| **UI-05** | UI | AC-06, BR-10 | Attachment list read-only state | Displays "Removed" badge and reason for soft-removed file; hides download button. | `client/src/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-02 | Full ticket submission flow | Complete flow: select user -> open form -> fill valid data -> upload -> submit -> view success. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-02** | E2E | AC-04 | Ticket search, filter, and pagination | Complete flow: open dashboard -> filter categories -> type search -> verify pagination updates. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-06 | Attachment upload and soft removal | Complete flow: open details -> upload file -> click remove -> type reason -> confirm -> check blocked download. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| **E2E-04** | E2E | AC-03 | Cross-requester URL interception | Complete flow: login as Jennifer -> attempt direct URL navigation to David's ticket -> verify redirect/access denied message. | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion (AC) | Mapped Test ID(s) |
| :--- | :--- |
| **AC-01 (Successful Submission)** | `API-01`, `UI-02`, `E2E-01` |
| **AC-02 (Unauthorized Access)** | `UI-01`, `E2E-01` |
| **AC-03 (Cross-Requester Security)** | `API-03`, `E2E-04` |
| **AC-04 (My Tickets Filters & Pagination)** | `API-04`, `UI-04`, `E2E-02` |
| **AC-05 (Attachment Constraints)** | `UNIT-02`, `API-02`, `API-05`, `UI-03` |
| **AC-06 (Attachment Soft Removal)** | `API-06`, `UI-05`, `E2E-03` |

---

## 4. Responsive and Visual Checklist

These visual inspections will be performed on desktop (`1280px`), tablet (`800px`), and mobile (`375px`) viewports:

| Viewport | Element Checked | Inspection Criteria | Result | Reference Image Path |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | My Tickets Table | Columns headers display correctly, text fits without wrapping, badges are centered. | Passed | `/artifacts/lab-02/screenshots/my-tickets/desktop.png` |
| **Desktop** | Create Ticket Form | Two-column grid is centered with a max width of 1000px. | Passed | `/artifacts/lab-02/screenshots/create-ticket/desktop.png` |
| **Tablet** | Create Ticket Form | Form shifts to comfortable stacked columns; input fields are wide enough. | Passed | `/artifacts/lab-02/screenshots/create-ticket/tablet.png` |
| **Mobile** | App Header | App header title and user profile stack vertically or collapse; tabs fit on screen. | Passed | `/artifacts/lab-02/screenshots/my-tickets/mobile_header.png` |
| **Mobile** | My Tickets Cards | The table collapses into cards; no horizontal overflow or scrollbar is present. | Passed | `/artifacts/lab-02/screenshots/my-tickets/mobile.png` |
| **Mobile** | Ticket Details | Fields stack vertically; buttons occupy full width and are touch-friendly (min height 44px). | Passed | `/artifacts/lab-02/screenshots/ticket-detail/mobile.png` |

---

## 5. Test Commands

Run the following commands in their respective directories to execute the automated test suites:

### 5.1. Backend Unit and API Integration Tests
Run Vitest tests for the server:
```bash
cd server
npm run test
```

### 5.2. Frontend UI Component Tests
Run Vitest tests for the client:
```bash
cd client
npm run test
```

### 5.3. End-to-End Tests
Run Playwright integration tests:
```bash
# From workspace root
npx playwright test
```

---

## 6. Final Results

### 6.1. Server Tests — 29/29 PASSED ✅

```
 ✓ tests/lab-02/helpers.test.ts > UNIT-01: generateTicketNumber > returns ticket number formatted as TKT-YYYY-XXXXXX
 ✓ tests/lab-02/helpers.test.ts > UNIT-01: generateTicketNumber > pads sequence correctly for 5th ticket
 ✓ tests/lab-02/helpers.test.ts > UNIT-02: validateAttachmentFile > accepts valid file types under 5MB
 ✓ tests/lab-02/helpers.test.ts > UNIT-02: validateAttachmentFile > rejects unsupported MIME types
 ✓ tests/lab-02/helpers.test.ts > UNIT-02: validateAttachmentFile > rejects files exceeding 5 MB
 ✓ tests/lab-02/helpers.test.ts > validateTicketFields > returns empty array for valid fields
 ✓ tests/lab-02/helpers.test.ts > validateTicketFields > returns error list for invalid fields
 ✓ tests/lab-01/health.test.ts > GET /api/health > returns 200 with status ok and the service name
 ✓ tests/lab-02/my-tickets.api.test.ts > returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/my-tickets.api.test.ts > returns 403 when requester is inactive
 ✓ tests/lab-02/ticket-detail.api.test.ts > returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/ticket-detail.api.test.ts > returns 403 when requester is inactive
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 403 when requester is inactive (BR-04, BR-11)
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 400 when summary is shorter than 10 characters (BR-05)
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 400 when description is shorter than 20 characters (BR-05)
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 400 when attachment has invalid file type (BR-06)
 ✓ tests/lab-02/create-ticket.api.test.ts > returns 201 and ticket number when all fields are valid (AC-01, BR-01, BR-02)
 ✓ tests/lab-01/categories.test.ts > returns the four seeded categories in id order
 ✓ tests/lab-02/requesters.api.test.ts > GET /api/requesters > returns 200 and only active development requesters
 ✓ tests/lab-02/requesters.api.test.ts > GET /api/systems > returns 200 and all 7 active related systems
 ✓ tests/lab-02/attachments.api.test.ts > POST returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/attachments.api.test.ts > GET returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/attachments.api.test.ts > DELETE returns 401 when x-requester-id header is missing
 ✓ tests/lab-02/attachments.api.test.ts > DELETE returns 400 when deletionReason is too short (BR-09)
 ✓ tests/lab-02/attachments.api.test.ts > API-05 — returns 400 when trying to add a 6th active attachment (BR-08)
 ✓ tests/lab-02/attachments.api.test.ts > API-06 — returns 200 and sets deletedAt when soft-removing (BR-09)
 ✓ tests/lab-02/attachments.api.test.ts > API-06 — returns 410 Gone when downloading soft-removed attachment (BR-10)
 ✓ tests/lab-02/attachments.api.test.ts > API-06 — returns 409 Conflict when soft-removing already-removed attachment

 Test Files  8 passed (8)
      Tests  29 passed (29)
```

### 6.2. Client Tests — 19/19 PASSED ✅

```
 ✓ tests/lab-01/App.test.tsx > renders the TokTickIT heading
 ✓ tests/lab-01/App.test.tsx > shows Online and the seeded categories on success
 ✓ tests/lab-01/App.test.tsx > shows an Offline error message when the API is unavailable
 ✓ tests/lab-02/RequesterSelector.test.tsx > renders the Development Requester Selection screen
 ✓ tests/lab-02/RequesterSelector.test.tsx > populates active requesters in the dropdown
 ✓ tests/lab-02/RequesterSelector.test.tsx > selecting a requester and clicking Continue loads the app shell
 ✓ tests/lab-02/RequesterSelector.test.tsx > clicking Change Requester returns to the selection screen
 ✓ tests/lab-02/CreateTicket.test.tsx > shows Create Ticket form with read-only requester field
 ✓ tests/lab-02/CreateTicket.test.tsx > shows inline validation errors when submitting empty form
 ✓ tests/lab-02/CreateTicket.test.tsx > shows error when summary is too short
 ✓ tests/lab-02/CreateTicket.test.tsx > shows success screen with ticket number after valid submission
 ✓ tests/lab-02/MyTickets.test.tsx > renders empty state card when user has no tickets
 ✓ tests/lab-02/MyTickets.test.tsx > renders ticket list table with tickets and badges when populated
 ✓ tests/lab-02/MyTickets.test.tsx > renders search input and category/priority/status filter dropdowns
 ✓ tests/lab-02/MyTickets.test.tsx > shows no matching tickets state when filter returns zero results
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > renders ticket details metadata in read-only mode
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > displays active attachments with download and remove options
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > displays soft-removed attachments with Removed badge and reason
 ✓ tests/lab-02/RequesterTicketDetail.test.tsx > opens soft removal modal and submits removal reason

 Test Files  5 passed (5)
      Tests  19 passed (19)
```

### 6.3. End-to-End (Playwright) Tests — 7/7 PASSED ✅

```
 ✓ E2E-01 > shows requester selector when no requester is in localStorage (AC-02)
 ✓ E2E-01 > completes full ticket creation and shows unique ticket number (AC-01, BR-01, BR-02)
 ✓ E2E-02 > search input shows no-results state for unmatched query (AC-04)
 ✓ E2E-02 > search input shows results when query matches a ticket summary (AC-04)
 ✓ E2E-02 > status filter dropdown updates the displayed list (AC-04)
 ✓ E2E-03 > uploads a file to a ticket and soft-removes it with a mandatory reason (AC-06)
 ✓ E2E-04 > API returns 403 Forbidden when accessing another requester's ticket (AC-03, BR-04)

 7 passed (13.6s)
```

### 6.4. Build Verification

| Check | Result |
| :--- | :--- |
| `cd server && npx tsc --noEmit` | 0 errors ✅ |
| `cd client && npx tsc --noEmit` | 0 errors ✅ |

---

## 7. Known Limitations or Deferred Tests

*   **Deferred Login Authentication**: The selector UI is a simulation only. Authentication checks (passwords, token-based sessions) are deferred to Lab 3.
*   **Static Comment Feed**: The comments listed in the ticket details view are static mock content. Add/delete comments capability is deferred to later labs.


## Answer Part 4: AI Use with Reflection

**Rendered ai-use.md:**

# Lab 2 — AI Use and Reflection

**LLM/agent used**: Antigravity (Gemini 3.5 Flash, Gemini 3.7 Flash, Claude Opus 4.6)

## Selected Key Prompts (6–10)

| # | Prompt (summarized) | What I did with the result |
| :--- | :--- | :--- |
| 1 | "Review the Lab 2 assignment PDF and build the implementation plan for the specification files." | Checked the plan for coverage of all required sections (specification, ui-spec, api-spec, tests, reviewer, ai-use) and approved it. |
| 2 | "Draft the sprint engineering specification for Lab 2." | Verified functional requirements (FR-01 to FR-10) and business rules (BR-01 to BR-15) are aligned with PDF guidelines. Corrected category and priority naming to match seed data. |
| 3 | "Create the Zen Green UI specification (ui-spec.md) covering layout, tokens, components, and responsiveness." | Checked colour tokens against PDF table and validated responsive breakpoint rules. |
| 4 | "Create the REST API contract (api-spec.md) with schemas, endpoints, and validation requirements." | Verified endpoint naming, query parameter defaults, ownership guard rules, and error response codes. |
| 5 | "Proceed with feature 9 — Ticket Detail Screen and Attachment Management." | Reviewed the proposed endpoints (GET /api/tickets/:id, POST /api/tickets/:id/attachments, GET/DELETE /api/attachments/:id) and the UI component design, then approved the plan. |
| 6 | "Do everything you need for full grade — write all remaining tests." | Verified the generated test files (unit, API integration, UI component, and Playwright E2E) covered every acceptance criterion and business rule in the specification. Manually re-ran failing tests and reviewed error output. |
| 7 | "Still have the problem — read the chat to get context, then why do I have the problem?" | Provided screenshots of the Docker database, migration status, and frontend error. The AI identified that the ticket number generator was using `prisma.ticket.count` which caused collision crashes (P2002) and refactored it to use `findFirst` + `findUnique` for collision-free generation. I validated the fix by re-running the server. |
| 8 | "Cancel all, I was on the wrong GitHub branch — go back to before." | The AI cleaned the working tree and confirmed the correct `lab2` branch was active. I verified the branch state before continuing. |
| 9 | "Finish all the previous tests so everything passes according to the PDF's criteria." | The AI fixed a Playwright E2E-03 selector issue (row click not navigating to detail view) and updated the unit test mocks to match the refactored `generateTicketNumber` function. I verified all 55 tests (29 server + 19 client + 7 E2E) passed green. |

## Reflection

Working with an AI pair programmer for Lab 2 significantly accelerated the boilerplate-heavy parts of development — schema definitions, CRUD endpoints, and repetitive test scaffolding — allowing me to focus on reviewing correctness and making design decisions. The most valuable lesson was learning to provide precise, contextual prompts: vague instructions like "fix it" produced generic solutions, whereas sharing exact error messages (e.g., the Prisma P2002 unique-constraint crash with screenshots) led to targeted, correct fixes. I also learned the importance of verifying AI-generated test selectors — the Playwright E2E-03 test failed because the AI used `td:has-text(...)` instead of targeting the `<tr>` row element with the click handler, which required me to inspect the DOM snapshot and guide the correction. Overall, the AI acted as a capable junior developer: fast at producing code, but requiring careful review and explicit corrections when its assumptions about DOM structure, mock shapes, or Prisma API surfaces diverged from the actual implementation.


## Answer Part 5: Development Requester Select Screen

*(Included in Part 6 as per guidelines)*

## Answer Part 6: Working Ticket Screen: Create Mode

**1. Development Requester Selection:**
![Requester Selector Placeholder](path/to/requester-selector.png)

**2. Create Ticket (Initial/Loaded from DB):**
![Create Ticket Initial](path/to/create-initial.png)

**3. Validation Failure (Empty fields):**
![Validation Failure](path/to/validation-failure.png)

**4. Attachment Test (Valid and Invalid):**
![Attachment Test](path/to/attachment-test.png)
*Explanation: The valid file (e.g. PDF under 5MB) is accepted, while the invalid file (e.g. .exe or >5MB) triggers a validation error message below the attachment section.*

**5. Submitting State (Busy/Spinner):**
![Submitting State](path/to/submitting.png)

**6. Success State (Generated Ticket Number):**
![Success State](path/to/success.png)

**7. API Failure (Safe Error State):**
![API Failure](path/to/api-failure.png)

## Answer Part 7: Working My Tickets Screen

**1. Requester A Tickets:**
![Requester A](path/to/requester-a-tickets.png)

**2. Requester B Tickets (Shows Requester A tickets disappear):**
![Requester B](path/to/requester-b-tickets.png)

**3. Search, Filters, Sorting, Pagination:**
![Filters and Pagination](path/to/filters-pagination.png)

**4. Empty State / No-Results State:**
![Empty State](path/to/empty-state.png)

## Answer Part 8: Working Ticket Screen: View Mode and Attachments

**1. Owned Ticket Detail:**
![Ticket Detail](path/to/ticket-detail.png)

**2. Download Active Attachment:**
![Download Attachment](path/to/download-attachment.png)

**3. Soft Removal with Reason & Retained Metadata:**
![Soft Removal](path/to/soft-removal.png)

**4. Blocked Removed Download (410 Gone):**
![Blocked Download](path/to/blocked-download.png)

**5. Unauthorized Ticket-Access Test (403 Forbidden):**
![Unauthorized Access](path/to/unauthorized-access.png)

## Answer Part 9: Zen Green UI and Responsive Evidence

**Link:** [ui-spec.md](./ui-spec.md)

**Rendered ui-spec.md:**

# Lab 2 UI Style and Screen Specification

This document details the **Zen Green Theme** visual design guidelines, typography, components, states, and screen layout structures for the TokTickIT Requester Ticketing MVP.

---

## 1. Color System (Zen Green Tokens)

To establish a consistent, professional, and accessible visual aesthetic, all components must use the following color variables:

| Token | CSS Variable Value | HEX | Intended Use / Examples |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `--color-primary-green` | `#006B3C` | App header background, primary action buttons, strong emphasis headers. |
| **Secondary Green** | `--color-secondary-green` | `#0B7A46` | Active tab indicators, focus borders, hyperlink text, hover states. |
| **Pale Green** | `--color-pale-green` | `#EAF6EF` | Selected list items background, success toast backgrounds, subtle section containers. |
| **Page Background** | `--color-bg-page` | `#F5F7F6` | Underlay background behind cards, soft near-white with a hint of green. |
| **Surface/Cards** | `--color-bg-surface` | `#FFFFFF` | Form cards, listing table background, ticket details container. |
| **Text Primary** | `--color-text-primary` | `#1A2E26` | Dark charcoal-green for body text and headings. High contrast (>= 4.5:1). |
| **Text Secondary** | `--color-text-secondary` | `#5F756B` | Muted slate-green for labels, subtitles, timestamps, and secondary info. |
| **Border Neutral** | `--color-border-neutral` | `#D2DDD8` | Input outlines, table dividers, card boundaries. |
| **Error Primary** | `--color-error` | `#8B0000` | Dark red for error message texts, error borders, and critical fields. |
| **Error Light** | `--color-error-light` | `#FFEAEA` | Soft red fill for error banner callouts. |
| **Warning Primary** | `--color-warning` | `#92400E` | Amber text for warning callouts and "Pending" status badges. |
| **Warning Light** | `--color-warning-light` | `#FEF3C7` | Amber fill for warning banners. |

---

## 2. Typography & Spacing

*   **Typography Family**: Use system-ui, or load Google Font `Outfit` or `Inter`. Avoid default Times New Roman.
*   **Font Weights**:
    *   Bold (`700`) for headers and titles.
    *   Medium (`500`) for field labels, buttons, and navigation.
    *   Regular (`400`) for body text, inputs, and descriptions.
*   **Scale**:
    *   `h1`: `1.75rem` (`28px`)
    *   `h2`: `1.25rem` (`20px`)
    *   `Body`: `1rem` (`16px`)
    *   `Small/Muted`: `0.875rem` (`14px`)
*   **Spacing Grid**: Use a 4px-base grid system for padding/margin (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).

---

## 3. Control and Input States

All form controls (text fields, dropdowns, textareas) must follow these rules:

*   **Editable**: White background (`#FFFFFF`), solid border (`#D2DDD8`), height 40px, rounded corners 6px, horizontal padding 12px.
*   **Focus State**: When active or tabbed, show a 2px solid ring outline of secondary green (`#0B7A46`) with a 1px offset to ensure keyboard accessibility.
*   **Disabled State**: Muted light gray-green background (`#E9EFEF`), text color `#A0B0A8`, cursor `not-allowed`.
*   **Read-Only/System-Generated**: Light gray-green background shading (`#F0F4F2`), border `#D2DDD8`, text remains highly readable.
*   **Invalid State**: Red border (`#8B0000`) and field label. An error message must render immediately below.
*   **Required-Field Indicator**: A red asterisk `*` (`#8B0000`) appended directly to the end of the field label (e.g. `Summary *`).

---

## 4. Button Hierarchy

Buttons must establish a clear visual hierarchy so users understand primary actions:

1.  **Primary Action**: Solid background (`#006B3C`), white text, no border. Hover: `#0B7A46`. Focus: green ring outline.
2.  **Secondary Action**: White background, secondary green outline (`#0B7A46`), text `#0B7A46`. Hover: `#EAF6EF`.
3.  **Destructive/Removal**: Muted background or simple link style with dark red (`#8B0000`) text. Hover: soft red background (`#FFEAEA`).
4.  **Disabled/Busy**: Muted gray background (`#D2DDD8`), white text, cursor `wait` or `not-allowed`. If the form is processing, show a loader/spinner next to text (e.g. `Submitting...`).

---

## 5. Responsive Viewport Adaptations

| Element / Section | Desktop (>= 992px) | Tablet (768px - 991px) | Mobile (< 768px) |
| :--- | :--- | :--- | :--- |
| **Shell Layout** | Horizontally centered, max-width `1200px`. | Padding `16px` on left/right. | Full width, compact header. |
| **Header Navigation** | Tabs side-by-side in header. | Compact tabs or sub-header. | Hamburger dropdown or stacked icons. |
| **Form Layout** | Two-column grid (left: meta fields, right: description). | Two-column or single column. | Single column. All fields stack. |
| **My Tickets List** | Full data table with all columns. | Table with key columns. | Grid of card components (no horizontal scroll). |
| **Ticket Details** | Grid of metadata cards + description. | Stacked layout. | Stacked layout. Buttons full width. |

---

## 6. Detailed Screen Specifications

### 6.1. Development Requester Selection Screen
*   **Card Container**: Centered vertically/horizontally, max-width `500px`.
*   **Instructional Banner**: A pale green info banner stating: *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication will be introduced in Lab 3."*
*   **Requester Dropdown**: Large dropdown containing only active requesters.
*   **Actions**: "Continue" (Primary button, disabled if no requester selected) and "Cancel" (Secondary button).
*   **API Failure state**: If active users fail to load, show a red error banner with a "Retry" button.

### 6.2. Create Ticket Screen
*   **Form Structure**:
    *   Top: Read-only fields (Ticket Number placeholder, Ticket Date initialized to current date, Requester auto-filled with selected name).
    *   Middle: Classification fields (Category dropdown, Related System dropdown, Priority radio/buttons).
    *   Text Fields: Summary (single line), Description (textarea with resize vertical only).
    *   File Dropzone: Large dashed-border dropzone for attachments. Displays selected files with name, size, type, and a "Delete" icon.
    *   Bottom: "Cancel" (Secondary action) and "Submit Ticket" (Primary action).
*   **Form Validation**: Error messages are placed directly below fields, keeping validation context clear.

### 6.3. My Tickets Dashboard Screen
*   **Header Section**: "My Tickets" page title, count of total tickets, and a "+ Create Ticket" button on the right.
*   **Filter/Search Bar**:
    *   Text input with search icon to search by Ticket Number or Summary.
    *   Dropdowns to filter by Category, Requested Priority, and Status.
    *   "Clear Filters" button to reset parameters.
*   **Ticket Table (Desktop)**:
    *   Columns: Ticket No., Created Date, Summary, Category, Priority (badge), Status (badge), Last Updated.
    *   Badges:
        *   Priority: `Low` (gray badge), `Medium` (yellow/orange badge), `High` (red/pink badge).
        *   Status: `New` (green badge), `Open` (blue badge), `Pending` (amber badge), `Resolved` (gray badge).
*   **Ticket Card List (Mobile)**:
    *   Table hides. Displays a vertical list of cards. Each card shows the ticket number, priority, status badges, summary, and date.
*   **Pagination Footer**: Centered pagination links: `[Previous]`, page numbers `[1]`, `[2]`, `[...]`, `[Next]`. Shows `Showing X to Y of Z tickets`.

### 6.4. Ticket Detail Screen
*   **Header**: Breadcrumbs `My Tickets > Ticket Details`, "Back to My Tickets" button.
*   **Layout**:
    *   Left side (or top on mobile): Field list displaying Ticket Number, Ticket Date, Category, Related System, Requester, Status, Priority, Summary, and Description in read-only form.
    *   Right side (or bottom on mobile):
        *   **Attachments Section**: List of uploaded files.
            *   *Active Attachments*: File name, size, and buttons to "Download" and "Remove".
            *   *Soft-Removed Attachments*: Displays greyed-out filename with strikethrough, a "Removed" badge, and the removal reason: *"Removed: <reason> by <User> on <Date>"*. The download link is disabled or hidden.
            *   *Add Attachment*: Dropzone button to add a new file directly to this ticket.
        *   **Comments Section**: Locked/Read-only display of historical comments (Jennifer Anderson, Michael Brown) for mock visualization purposes.

---

## 7. Accessibility (A11y) & Visual Verification

*   **Keyboard Navigation**: All interactive elements (inputs, dropdowns, buttons, list rows) must be accessible via Tab key and triggerable via Enter/Space.
*   **ARIA Labels**: Interactive icons (such as the attachment trash icon) must contain `aria-label="Remove attachment"` and `title="Remove attachment"`.
*   **Screen Layout Verification Paths**:
    *   Create Ticket View screenshot path: `/artifacts/lab-02/screenshots/create-ticket/`
    *   My Tickets Dashboard screenshot path: `/artifacts/lab-02/screenshots/my-tickets/`
    *   Ticket Details View screenshot path: `/artifacts/lab-02/screenshots/ticket-detail/`
*   **Visual Checklist**:
    - [ ] No labels clipped or wrapping onto input fields.
    - [ ] No overlapping text or messages in mobile layout.
    - [ ] No horizontal page scrolling at any viewport size (from 320px to 1920px).
    - [ ] Contrast ratio between text color and background is at least 4.5:1.


**Responsive Screenshots:**

**Desktop Layout:**
![Desktop Layout](path/to/desktop.png)

**Tablet Layout:**
![Tablet Layout](path/to/tablet.png)

**Mobile Layout:**
![Mobile Layout](path/to/mobile.png)

