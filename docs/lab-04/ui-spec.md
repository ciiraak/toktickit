# Lab 4 UI Specification — Zen Green Design System

## 1. Design System Overview & Tokens

TokTickIT maintains the **Zen Green** design language introduced in Lab 2 and expanded in Lab 3. All new components in Sprint 4 (Dashboards, Actions Taken, and Workflow Controls) strictly follow these design tokens and conventions.

### 1.1 Color Tokens
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--color-primary-green` | `#0B7A46` | Navigation header, primary actions, active tabs |
| `--color-primary-hover` | `#085C35` | Hover state for primary buttons |
| `--color-pale-green` | `#E8F5EE` | Dashboard metric card backgrounds, active filters |
| `--color-accent-gold` | `#D97706` | Medium priority badge, waiting status badge |
| `--color-danger-red` | `#DC2626` | High priority badge, urgent indicator, alert banners |
| `--color-amber-note` | `#FFFBEB` | Internal notes card background |
| `--color-blue-action` | `#EFF6FF` | Actions Taken card highlight / badge background |
| `--color-blue-border` | `#BFDBFE` | Actions Taken border highlight |
| `--color-bg-light` | `#F9FAFB` | Application viewport background |
| `--color-card-bg` | `#FFFFFF` | Form surfaces, dashboard cards, tables |
| `--color-border-subtle` | `#E5E7EB` | Card dividers, table borders |
| `--color-text-primary` | `#111827` | Headings, card titles, key metric numbers |
| `--color-text-muted` | `#6B7280` | Labels, timestamps, secondary copy |

---

## 2. Navigation & App Shell Updates

### 2.1 Role-Based Navigation Header
The top navigation bar (`.app-header`) includes a prominent **Dashboard** tab for all roles:
*   **Requester Navigation**: `Dashboard` | `My Tickets` | `Create Ticket`
*   **IT Staff Navigation**: `Dashboard` | `IT Staff Queue` | `Create Ticket`
*   **Administrator Navigation**: `Dashboard` | `IT Staff Queue` | `User Management` | `Create Ticket`

### 2.2 Active Tab Indicator
*   The active navigation link has a white background pill or underlined border with bold text to clearly highlight the current screen.
*   Clicking "TokTickIT" logo routes to `Dashboard` for authenticated users.

---

## 3. Screen Specifications

### 3.1 Screen 1: IT Staff Dashboard (`StaffDashboard.tsx`)
A high-level operational command center for IT Staff and Administrators.

*   **Welcome Banner**:
    *   Heading: `"Welcome back, [First Name]!"`
    *   Subheading: `"Here's what's happening with your queue today."`
    *   Refresh button with loading indicator.
*   **Operational Metric Cards Grid**:
    *   5 responsive cards:
        1. **New**: Count of newly filed tickets.
        2. **Open**: Count of open tickets awaiting triage.
        3. **In Progress**: Count of actively worked tickets.
        4. **Waiting for Requester**: Count of tickets blocked on requester response.
        5. **My Assigned**: Count of open tickets owned by the current staff user.
    *   *Card Interaction*: Clicking a metric card navigates to `/staff/queue` pre-filtered by that status or owner.
*   **Two-Column Bottom Section**:
    *   **Left Column (Recent / Urgent Tickets)**:
        *   Card displaying the 5 most recently updated tickets.
        *   Table columns: Ticket ID, Summary, Status badge, Timestamp, and View action.
        *   "View all" link routing to the full IT Staff Queue.
        *   Empty state: `"No recent tickets to display."`
    *   **Right Column (Quick Actions Card)**:
        *   `+ Create Ticket`: Opens ticket creation screen.
        *   `🔍 Search Tickets`: Routes to Queue with focus on search bar.
        *   `📋 My Queue`: Filters queue to `owner=me`.

---

### 3.2 Screen 2: Requester Dashboard (`RequesterDashboard.tsx`)
A clear personal summary of the authenticated Requester's service requests.

*   **Welcome Banner**:
    *   Heading: `"Welcome, [First Name]!"`
    *   Subheading: `"Here's the latest on your requests."`
*   **Personal Metric Cards Grid**:
    *   4 cards:
        1. **My Open Tickets**: Total unresolved tickets.
        2. **In Progress**: Tickets currently being handled.
        3. **Resolved**: Tickets resolved waiting for closure.
        4. **Closed**: Historical resolved/closed tickets.
    *   Each card features a `"View all"` drill-down action linking to the requester's ticket list.
*   **Two-Column Bottom Section**:
    *   **Left Column (My Recent Tickets)**:
        *   Card showing the 5 most recent tickets submitted by the requester.
        *   Clicking any row opens the Requester Ticket Detail screen.
        *   Empty state: `"You haven't submitted any tickets yet. Need help? Create a ticket to get started."`
    *   **Right Column (Quick Actions)**:
        *   `+ Create Ticket`: Button routing to ticket submission.
        *   `📂 View My Tickets`: Button routing to the full My Tickets list.

---

### 3.3 Screen 3: Actions Taken on IT Staff Ticket Detail (`ActionsTakenSection.tsx`)
Integrated into the IT Staff Ticket Detail screen below conversations and notes.

*   **Section Header**:
    *   Heading: `"Actions Taken"` with count badge (e.g. `(3)`).
    *   Primary action button: `"+ Add Action Taken"`.
*   **Action Entry List / Table**:
    *   Each Action Taken card or table row displays:
        *   **Action Date/Time**: Formatted human-readable date and time.
        *   **Performed By**: Staff member's name and role badge (auto-populated).
        *   **Description**: Detailed text of action taken.
        *   **Result**: Result outcome of the action.
        *   **Follow-Up Status**: Badge indicating `"Follow-up Required"` (Amber) or `"No Follow-up"` (Subtle gray). If required, renders the `Follow-up Note` prominently.
        *   **Attachment Notes**: File references or diagnostic notes (if provided).
        *   **Edit Action**: Inline button opening edit mode.
*   **Add / Edit Action Taken Modal or Form**:
    *   Fields:
        *   `Action Date/Time`: Datetime-local picker, defaulting to current time.
        *   `Action Description`: Multi-line textarea (required).
        *   `Result`: Multi-line textarea (required).
        *   `Follow-Up Required?`: Checkbox toggle.
        *   `Follow-Up Note`: Textarea that dynamically becomes **required** when the checkbox is checked, with clear helper text.
        *   `Attachment Notes`: Text input for image/file references.
    *   Actions: `"Save Action Taken"` (with loading spinner) and `"Cancel"`.
    *   Validation banners for missing required fields.

---

### 3.4 Screen 4: Actions Taken on Requester Ticket Detail
*   Read-only timeline/card presentation within `RequesterTicketDetail.tsx`.
*   Requesters see: Action Date, Description, Result, Follow-up badge, and Staff member name.
*   No edit or create controls are displayed to Requesters.

---

### 3.5 Screen 5: Ticket Status Workflow Controls
*   Located in the Operations Sidebar of `StaffTicketDetail.tsx`.
*   Status dropdown options are dynamically filtered to show **only** permitted transitions according to the state transition matrix:
    *   From `New`: `Open`, `Cancelled`
    *   From `Open`: `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled`
    *   From `In Progress`: `Waiting for Requester`, `Resolved`, `Cancelled`
    *   From `Waiting for Requester`: `In Progress`, `Resolved`, `Cancelled`
    *   From `Resolved`: `Closed`, `Reopened`
    *   From `Closed`: `Reopened`
    *   From `Reopened`: `In Progress`, `Resolved`, `Cancelled`
    *   From `Cancelled`: No transitions (disabled)
*   **Concurrency Feedback**: If another user updated the ticket concurrently, a prominent amber conflict alert is displayed: `"This ticket has been updated by another user. Please refresh the page to view the latest status."`

---

## 4. Responsive & Accessibility Standards

### 4.1 Responsive Breakpoints
*   **Desktop (≥ 1024px)**: Full multi-column dashboard grid and two-column ticket details.
*   **Tablet (768px – 1023px)**: 2-column metric cards, stacked recent tickets and quick actions.
*   **Mobile (< 768px)**: Single-column stacked cards, full-width buttons, zero horizontal scroll.

### 4.2 Accessibility Checklist
- [x] All form controls have associated `<label>` elements with matching `htmlFor`/`id`.
- [x] Visible focus rings (`outline: 2px solid var(--color-primary-green)`) on all interactive buttons, links, and inputs.
- [x] Non-color cues for statuses and priorities (text labels accompany all color badges).
- [x] Dynamic modal dialogs have ARIA roles (`role="dialog"`, `aria-labelledby`, `aria-modal="true"`) and trap focus.
- [x] Meaningful error announcements via `aria-live="polite"` or `role="alert"`.
