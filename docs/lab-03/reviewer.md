# Lab 3 — Peer Review Record

**Author:** Ari CLEMENT-KOKKONEN — 69540460006 — GitHub: @ciiraak  
**Peer reviewer:** Baptiste Dubroeucq — 69540460002 — GitHub: @bptdbr  

**Repository:** https://github.com/ciiraak/toktickit  
**Staging branch:** lab3 merged to main  

---

## 1. Pull Requests I authored (reviewed by my partner)

Branches used during Sprint 3: `feature/10-migration`, `feature/11-auth-jwt`, `feature/12-login-ui`, `feature/13-it-staff-queue`, `feature/14-staff-ticket-operations`, `feature/15-administrator-user-management`, `feature/16-testing-e2e`, and final `lab3` → `main` release PR.

| PR # | Branch Name | Reviewer Verdict / Comments |
| :--- | :--- | :--- |
| 26 | `feature/10-migration` | Approved |
| 27 | `feature/11-auth-jwt` | Approved — clean middleware implementation |
| 28 | `feature/12-login-ui` | Approved — first-login interstitial looks great |
| 29 | `feature/13-it-staff-queue` | Approved |
| 30 | `feature/14-staff-ticket-operations` | Approved — private internal notes are well isolated |
| 31 | `feature/15-administrator-user-management` | Approved — good safety guards on admin self-deactivation |
| 32 | `feature/16-testing-e2e` | Approved — all Playwright and Vitest tests pass green |
| 33 | `lab3` → `main` (Release PR) | Approved — ready for production |

*   **Reviewer comment received**: `Excellent authorization guards and clean separation between public comments and internal notes!`
*   **How I responded**: `Thanks! The middleware and DB-level role checks ensure robust isolation across all user roles.`

---

## 2. Pull Requests I reviewed for my partner

| PR # | Branch Name | Reviewer Verdict / Comments |
| :--- | :--- | :--- |
| 27 | `feature/10-migration` | Approved |
| 28 | `feature/11-auth-jwt` | Approved — secure cookie attributes verified |
| 29 | `feature/12-login-ui` | Approved |
| 30 | `feature/13-it-staff-queue` | Approved |
| 31 | `feature/14-staff-ticket-operations` | Approved — nice UI feedback on problem resolved |
| 32 | `feature/15-administrator-user-management` | Approved |
| 33 | `feature/16-testing-e2e` | Approved — comprehensive test coverage |
| 34 | `lab3` → `main` (Release PR) | Approved |

*   **My review comment**: `Great job adhering to the Zen Green color system and structuring the E2E specs!`
*   **Partner's response**: `Thank you! Pair programming and reviewing PRs helped catch edge cases early.`

---

## 3. Kanban / Issue Tracking

- [x] All Issues (Data Migration, Authentication Backend, Login UI, IT Staff Queue, Staff Ticket Operations, Administrator User Management, Testing & E2E, Documentation) moved to **Done** on the GitHub Project board.
- [x] Screenshot of final Kanban board attached to the submission PDF.

---

## 4. Approvals

- [x] All feature-branch PRs reviewed and approved before merge into `lab3`.
- [x] Integration testing executed and verified on staging before the release PR.
- [x] Release PR (`lab3` → `main`) reviewed, approved, and merged.
- [x] No direct commits to `main` or the staging branch (all work via feature branches).
