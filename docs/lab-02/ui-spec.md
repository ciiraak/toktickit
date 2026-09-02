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
