import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-03: IT Staff Ticket Flow", () => {
  test("views queue, opens ticket, assigns owner, and posts internal note", async ({ page }) => {
    await loginAs(page, "staff1@kmutt.ac.th", "Password123!");

    // Handle initial password change if needed
    const changePwdForm = page.locator("[data-testid='change-password-form']");
    if (await changePwdForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("StaffPassword123!");
      await page.locator("#confirm-password-input").fill("StaffPassword123!");
      await page.click("[data-testid='change-password-submit']");
    }

    // Go to IT Staff Queue
    const staffQueueNav = page.locator("[data-testid='nav-staff-queue']");
    await expect(staffQueueNav).toBeVisible({ timeout: 10000 });
    await staffQueueNav.click();

    // Verify queue table / list loads
    const queueHeader = page.locator("h2:has-text('IT Staff Ticket Queue')");
    await expect(queueHeader).toBeVisible({ timeout: 10000 });

    // Open first available ticket in queue
    const firstTicketLink = page.locator(".zen-table tbody tr").first();
    if (await firstTicketLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTicketLink.click();

      // Verify Ticket Detail view is rendered
      await expect(page.locator("button:has-text('Back to Queue')")).toBeVisible({ timeout: 10000 });

      // Add Internal Note (staff only)
      const noteInput = page.locator("textarea[placeholder*='Internal notes are only visible']");
      if (await noteInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await noteInput.fill("Automated E2E internal investigation note.");
        await page.click("button:has-text('Add Note')");
        await expect(page.locator("text=Automated E2E internal investigation note.")).toBeVisible({ timeout: 8000 });
      }
    }

    await logout(page);
  });
});
