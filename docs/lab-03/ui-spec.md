# Lab 3 UI Specification — Zen Green Design System

## 1. Design Principles & Theme Tokens

TokTickIT uses the **Zen Green** design language, emphasizing calm, professional tones, clean typography, rounded surfaces, and clear visual hierarchy across different user roles.

### 1.1 Color Tokens
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--color-primary-green` | `#0B7A46` | Brand header, primary buttons, active state indicators |
| `--color-primary-hover` | `#085C35` | Hover state for primary buttons |
| `--color-pale-green` | `#E8F5EE` | Subtle active item backgrounds, success callout boxes |
| `--color-accent-gold` | `#D97706` | Medium priority badge, warnings, mandatory change badge |
| `--color-danger-red` | `#DC2626` | High priority badge, error banners, deactivation actions |
| `--color-amber-note` | `#FFFBEB` | Staff internal note highlight background |
| `--color-amber-border` | `#FDE68A` | Staff internal note border |
| `--color-bg-light` | `#F9FAFB` | Page viewport background |
| `--color-card-bg` | `#FFFFFF` | Form surfaces, table cards, modal bodies |
| `--color-border-subtle` | `#E5E7EB` | Dividers, card borders, table row separators |
| `--color-text-primary` | `#111827` | Headings, primary content labels |
| `--color-text-muted` | `#6B7280` | Subtext, timestamps, field hints |

---

## 2. Layout & App Shell

### 2.1 Persistent Top Header (`.app-header`)
*   **Background**: Deep Zen Green (`#0B7A46`), text color white.
*   **Brand Icon & Title**: Left-aligned shield icon with "TokTickIT" text (clickable, navigates to default tab).
*   **Role-Based Navigation Tabs**:
    *   **Requester**: `My Tickets`, `Create Ticket`
    *   **IT Staff**: `My Tickets`, `Create Ticket`, `IT Staff Queue`
    *   **Administrator**: `My Tickets`, `Create Ticket`, `IT Staff Queue`, `User Management`
*   **User Identity Widget**:
    *   Circular avatar badge with two-letter uppercase user initials.
    *   User's full name and subtle role subtitle (e.g. "Administrator").
    *   **Sign Out Button**: Outlined button triggering session logout.

---

## 3. Screen Specifications

### 3.1 Screen 1: Login & Change Password Interstitial
*   **Login View**:
    *   Centered card on light background with branded green icon.
    *   Email input (`#email-input`) with auto-focus.
    *   Password input (`#password-input`).
    *   Submit button with loading spinner state (`"Signing In..."`).
    *   Localized error banner displaying server feedback on authentication failure.
*   **Mandatory Password Change Interstitial**:
    *   Full-screen overlay blocking normal application navigation.
    *   Notice informing the user that their initial or reset password must be changed before continuing.
    *   Current password, new password, and confirmation password inputs.
    *   Client-side validation (minimum 6 characters, passwords match, differs from current).

---

### 3.2 Screen 2: Requester Ticket Detail & Public Comments
*   **Header**: Ticket number, status badge, priority badge, category badge, and creation date.
*   **Description & Metadata**: Formatted read-only description and related system.
*   **Attachments Section**: Active attachments list with download links, file sizes, and soft-remove button (triggering reason modal).
*   **Public Comments Stream**:
    *   Chronological list of public messages from the requester and IT staff.
    *   Author name, role badge, and human-readable timestamp.
    *   Input textarea with "Add Comment" button.
*   **"Problem Appears Resolved" Action**:
    *   Prominent secondary action button allowing the requester to signal that the issue is fixed.
    *   Posts an automated public acknowledgment comment and displays a positive feedback notification.

---

### 3.3 Screen 3: IT Staff Ticket Queue
*   **Toolbar & Filters**:
    *   Search bar matching ticket numbers or summary keywords.
    *   Category, Priority, and Status dropdown filters.
    *   Clear Filters button.
*   **Data Table**:
    *   Columns: Ticket No., Date, Requester, Summary, Priority (IT / Requested), Status, Assignee, Actions.
    *   Hover highlight on rows; clicking opens ticket detail view.
*   **Pagination Bar**: Showing current page, total records, and previous/next page controls.

---

### 3.4 Screen 4: IT Staff Ticket Detail & Operations
*   **Two-Column Split Layout**:
    *   **Left Column (Conversation Streams)**:
        *   **Public Comments Section**: White card containing user-visible comments and comment posting form.
        *   **Internal Notes Section**: Warm amber card (`--color-amber-note`) with lock icon indicator (`🔒 Internal Staff Note`), strictly isolated to IT Staff and Admins.
    *   **Right Column (Operations Sidebar)**:
        *   **Ticket Owner**: Assignee selector populated with active IT Staff and Admins.
        *   **IT Priority**: Dropdown allowing priority override (`LOW`, `MEDIUM`, `HIGH`).
        *   **Status Transitions**: Dropdown allowing status changes (`In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Cancelled`).
        *   **Save Changes**: Triggers `PATCH /api/staff/tickets/:id` with instant UI update.

---

### 3.5 Screen 5: Administrator User Management
*   **Toolbar**:
    *   Search input matching name or email.
    *   Role filter (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) and Status filter (`Active`, `Inactive`).
    *   **Create User Button**: Opens user creation modal.
*   **User Directory Table**:
    *   Columns: `#`, User (Name + Email), Role (colored badge), Status (Active/Inactive), Password Status ("Must Change" vs. "Standard"), Actions.
    *   Action Buttons:
        *   **Edit**: Opens modal to update name, email, role, and active status.
        *   **Reset Pwd**: Opens modal to generate a new temporary password.
        *   **Activate / Deactivate**: Instant toggle button. Self-deactivation button is permanently disabled for the current admin.
*   **Modals**:
    *   Accessible, keyboard-navigable modals with validation feedback and backdrop blur.
