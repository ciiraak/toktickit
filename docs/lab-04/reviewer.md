# Lab 4 — Peer Review Record

**Author:** Ari CLEMENT-KOKKONEN — 69540460006 — GitHub: @ciiraak  
**Peer reviewer:** Baptiste Dubroeucq — 69540460002 — GitHub: @bptdbr  

**Repository:** https://github.com/ciiraak/toktickit  
**Staging branch:** lab4-staging merged to main  

---

## 1. Pull Requests I authored (reviewed by my partner)

Branches planned during Sprint 4: `feature/17-sprint4-specifications`, `feature/18-actions-taken-foundation`, `feature/19-ticket-workflow`, `feature/20-role-dashboards`, `feature/21-actions-taken-ui`, `feature/22-final-hardening-e2e`, and final `lab4-staging` → `main` release PR.

| PR # | Branch Name | Reviewer Verdict / Comments |
| :--- | :--- | :--- |
| 38 | `feature/17-sprint4-specifications` | Approved — comprehensive contracts covering Actions Taken, Workflow, and Dashboards |
| 39 | `feature/18-actions-taken-foundation` | Approved — Prisma migration `add_actions_taken`, seed with 8 statuses, and REST APIs with RBAC guards |
| 40 | `feature/19-ticket-workflow` | Approved — Status transition matrix, advisory resolution gate, and stale-concurrency HTTP 409 handling |
| 41 | `feature/20-role-dashboards` | Approved — IT Staff and Requester dashboard APIs, metric aggregation, and Zen Green UI components |
| 42 | `feature/21-actions-taken-ui` | Approved — ActionsTakenSection with create form, follow-up validation, in-place edit, and read-only mode for requesters |
| 43 | `feature/22-final-hardening-e2e` | Approved — Full Playwright E2E suites (Actions Taken flow, ticket resolution, dashboards) and zero-regression pass |
| 44 | `lab4-staging` → `main` (Release PR) | Approved — Final sprint release PR merged with 220/220 passing automated tests |

*   **Reviewer comment received**: *"Please ensure that when a requester indicates that their problem appears resolved, the ticket status does not jump directly to Resolved, and that the follow-up note is strictly mandatory whenever the follow-up checkbox is checked."*
*   **How I responded**: *"Confirmed. In accordance with BR-04 and BR-05, the 'Problem Appears Resolved' button only posts an advisory public comment without mutating the authoritative ticket status (which requires IT Staff action), and both client and backend strictly reject any Action Taken where `followUpRequired=true` without a non-empty `followUpNote` (HTTP 400)."*

---

## 2. Pull Requests I reviewed for my partner

| PR # | Branch Name | Reviewer Verdict / Comments |
| :--- | :--- | :--- |
| 38 | `feature/17-sprint4-specifications` | Approved — Clear requirements mapping and acceptance criteria traceability |
| 39 | `feature/18-actions-taken-foundation` | Approved — Verified schema foreign keys, index on `ticketId`, and idempotent seed script |
| 40 | `feature/19-ticket-workflow` | Approved — Verified valid status transitions and optimistic lock on `updatedAt` |
| 41 | `feature/20-role-dashboards` | Approved — Verified requester metrics isolation and staff queue metric cards |
| 42 | `feature/21-actions-taken-ui` | Approved — Verified inline edit capability and read-only visibility for requesters |
| 43 | `feature/22-final-hardening-e2e` | Approved — Verified complete Playwright end-to-end test execution |
| 44 | `lab4-staging` → `main` (Release PR) | Approved — Clean staging integration with zero regression |

*   **My review comment**: *"Ensure that optimistic concurrency returns HTTP 409 Conflict with an actionable message prompting the IT Staff user to reload the latest ticket state rather than silently failing."*
*   **Partner's response**: *"Updated the ticket update handler and frontend error banner to display 'This ticket has been updated by another user. Please refresh the page to view the latest status.' upon HTTP 409."*

---

## 3. Kanban / Issue Tracking

- [x] Sprint 4 engineering contract (`docs/lab-04/`)
- [x] Actions Taken foundation (Prisma migration, model, seed, APIs, authorization, tests)
- [x] Actions Taken UI (Ticket Detail list, create/edit behavior, responsive layout, tests)
- [x] Ticket workflow (Resolution gate, status transitions, UI, tests)
- [x] Role dashboards (Requester and IT Staff dashboard APIs, metrics, drill-down, UI, tests)
- [x] Final hardening (Regression, accessibility, visual consistency, error handling, release verification)

---

## 4. Approvals

- [x] All feature-branch PRs reviewed and approved before merge into `lab4-staging`.
- [x] Integration and regression testing executed and verified on staging before the release PR.
- [x] Release PR (`lab4-staging` → `main`) reviewed, approved, and merged.
