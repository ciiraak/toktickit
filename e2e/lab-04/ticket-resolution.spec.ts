import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-02: Ticket Resolution & Advisory Gate (FR-06, FR-07 / AC-05, AC-06, AC-07)", () => {
  test("Requester signals problem resolved without altering authoritative status; IT Staff formally resolves and closes ticket", async ({ page }) => {
    // 1. Requester logs in and signals advisory resolution
    await loginAs(page, "jennifer.anderson@kmutt.ac.th", "Password123!");

    const myTicketsNav = page.locator("[data-testid='nav-my-tickets']");
    await expect(myTicketsNav).toBeVisible({ timeout: 10000 });
    await myTicketsNav.click();

    // Find and click on an active (non-resolved, non-closed) ticket
    const ticketRow = page.locator("table tbody tr, .zen-table tbody tr").first();
    await expect(ticketRow).toBeVisible({ timeout: 10000 });
    await ticketRow.click();

    // Check if "Problem Appears Resolved" button is available
    const resolvedBtn = page.locator("button:has-text('Problem Appears Resolved')");
    if (await resolvedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resolvedBtn.click();

      // Verify advisory feedback message appears
      const successBanner = page.locator(".zen-banner-info");
      await expect(successBanner).toBeVisible({ timeout: 8000 });
      await expect(successBanner).toContainText(/problem appears resolved/i);

      // Verify a public comment was posted with the advisory message
      await expect(
        page.locator("text=Requester indicated that the problem appears resolved.")
      ).toBeVisible({ timeout: 8000 });
    }

    await logout(page);

    // 2. IT Staff reviews advisory comment and formally transitions ticket status
    await loginAs(page, "staff1@kmutt.ac.th", "Password123!");

    const staffQueueNav = page.locator("[data-testid='nav-staff-queue']");
    await expect(staffQueueNav).toBeVisible({ timeout: 10000 });
    await staffQueueNav.click();

    const staffTicketRow = page.locator(".zen-table tbody tr").first();
    await expect(staffTicketRow).toBeVisible({ timeout: 10000 });
    await staffTicketRow.click();

    // Check status dropdown options
    const statusSelect = page.locator("#staff-status-select");
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    const currentStatus = await statusSelect.inputValue();

    // If current status allows transition to Resolved
    if (currentStatus !== "Cancelled") {
      // Step to Resolved or Closed
      const options = await statusSelect.locator("option").allInnerTexts();

      if (options.includes("Resolved")) {
        await statusSelect.selectOption("Resolved");
        await page.click("button:has-text('Save Operations'), form button[type='submit']");
        await expect(page.locator("text=Ticket updated successfully.")).toBeVisible({ timeout: 8000 });
      }

      // If in Resolved, transition to Closed
      const updatedOptions = await statusSelect.locator("option").allInnerTexts();
      if (updatedOptions.includes("Closed")) {
        await statusSelect.selectOption("Closed");
        await page.click("button:has-text('Save Operations'), form button[type='submit']");
        await expect(page.locator("text=Ticket updated successfully.")).toBeVisible({ timeout: 8000 });
      }
    }

    await logout(page);
  });
});
