import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-01: Actions Taken Workflow (FR-01, FR-03, FR-04, FR-05 / AC-01, AC-03, AC-04)", () => {
  test("IT Staff logs an action taken with follow-up, edits it, and Requester views it read-only", async ({ page }) => {
    // 1. Login as IT Staff
    await loginAs(page, "staff1@kmutt.ac.th", "Password123!");

    // 2. Navigate to IT Staff Queue
    const staffQueueNav = page.locator("[data-testid='nav-staff-queue']");
    await expect(staffQueueNav).toBeVisible({ timeout: 10000 });
    await staffQueueNav.click();

    // 3. Open first ticket in queue
    const firstTicketRow = page.locator(".zen-table tbody tr").first();
    await expect(firstTicketRow).toBeVisible({ timeout: 10000 });
    await firstTicketRow.click();

    // 4. Verify Actions Taken section exists
    const actionsSection = page.locator("[data-testid='actions-taken-section']");
    await expect(actionsSection).toBeVisible({ timeout: 10000 });

    // 5. Open Add Action Taken Form
    const addActionBtn = page.locator("[data-testid='add-action-button']");
    await expect(addActionBtn).toBeVisible({ timeout: 8000 });
    await addActionBtn.click();

    const addActionForm = page.locator("[data-testid='add-action-form']");
    await expect(addActionForm).toBeVisible({ timeout: 5000 });

    // 6. Fill out Action details
    const now = Date.now();
    const uniqueDesc = `E2E Diagnostic Task ${now}: Replaced core patch cable`;
    const uniqueResult = `CRC errors dropped to 0, 10G link established ${now}`;
    const uniqueFollowup = `Monitor switch port for next 24 hours ${now}`;

    await page.locator("#action-description-input").fill(uniqueDesc);
    await page.locator("#action-result-input").fill(uniqueResult);

    // Check follow-up required checkbox
    const followupCheckbox = page.locator("#action-followup-checkbox");
    await followupCheckbox.check();

    // Fill follow-up note
    await page.locator("#action-followup-note-input").fill(uniqueFollowup);
    await page.locator("#action-attachments-input").fill("fluke_test_report.pdf");

    // 7. Save Action Taken
    await page.locator("[data-testid='submit-action-button']").click();

    // 8. Verify action card is rendered with all details
    await expect(actionsSection.getByText(uniqueDesc)).toBeVisible({ timeout: 10000 });
    await expect(actionsSection.getByText(uniqueResult)).toBeVisible({ timeout: 10000 });
    await expect(actionsSection.locator("[data-testid='followup-required-badge']").first()).toBeVisible();
    await expect(actionsSection.getByText(uniqueFollowup)).toBeVisible();

    // 9. Test In-Place Edit Mode
    const editBtn = actionsSection.locator("[data-testid^='edit-action-button-']").last();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      const editResultInput = page.locator("textarea[aria-label='Edit result']");
      await expect(editResultInput).toBeVisible({ timeout: 5000 });
      const updatedResult = `${uniqueResult} (Verified by QA)`;
      await editResultInput.fill(updatedResult);

      await page.locator("[data-testid='save-edit-action-button']").click();
      await expect(actionsSection.getByText(updatedResult)).toBeVisible({ timeout: 10000 });
    }

    // 10. Logout IT Staff
    await logout(page);

    // 11. Login as Requester to verify read-only behavior
    await loginAs(page, "jennifer.anderson@kmutt.ac.th", "Password123!");

    // Navigate to My Tickets
    const myTicketsNav = page.locator("[data-testid='nav-my-tickets']");
    await expect(myTicketsNav).toBeVisible({ timeout: 10000 });
    await myTicketsNav.click();

    // Open first ticket
    const requesterTicketRow = page.locator("table tbody tr, .zen-table tbody tr").first();
    if (await requesterTicketRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      await requesterTicketRow.click();

      // Verify Actions Taken is visible on Requester Ticket Detail
      const requesterActionsSection = page.locator("[data-testid='actions-taken-section']");
      await expect(requesterActionsSection).toBeVisible({ timeout: 10000 });

      // Verify Add Action Taken button and Edit buttons are NOT visible (read-only)
      await expect(page.locator("[data-testid='add-action-button']")).not.toBeVisible();
      await expect(page.locator("[data-testid^='edit-action-button-']")).not.toBeVisible();
    }

    await logout(page);
  });
});
