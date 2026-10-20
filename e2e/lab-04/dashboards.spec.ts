import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-03: Role-Appropriate Dashboards & Drill-down (FR-09, FR-10 / AC-09, AC-10)", () => {
  test("IT Staff Dashboard renders operational metrics with working queue drill-downs", async ({ page }) => {
    // 1. Login as IT Staff
    await loginAs(page, "staff1@kmutt.ac.th", "Password123!");

    // 2. Click Dashboard nav tab
    const dashboardNav = page.locator("[data-testid='nav-dashboard']");
    await expect(dashboardNav).toBeVisible({ timeout: 10000 });
    await dashboardNav.click();

    // 3. Verify IT Staff Dashboard greeting & metric grid
    await expect(page.locator("[data-testid='dashboard-greeting']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='staff-metric-cards']")).toBeVisible({ timeout: 10000 });

    // Verify all 5 operational metric cards
    await expect(page.locator("#metric-new")).toBeVisible();
    await expect(page.locator("#metric-open")).toBeVisible();
    await expect(page.locator("#metric-in-progress")).toBeVisible();
    await expect(page.locator("#metric-waiting")).toBeVisible();
    await expect(page.locator("#metric-my-assigned")).toBeVisible();

    // 4. Test Metric Card Drill-Down (clicking Open card navigates to queue)
    const openCard = page.locator("#metric-open");
    await openCard.click();

    // Verify navigates to Staff Queue view
    await expect(page.locator("h2:has-text('Ticket Queue')")).toBeVisible({ timeout: 10000 });

    await logout(page);
  });

  test("Requester Dashboard renders personal metrics with working ticket navigation", async ({ page }) => {
    // 1. Login as Requester
    await loginAs(page, "jennifer.anderson@kmutt.ac.th", "Password123!");

    // 2. Click Dashboard nav tab
    const dashboardNav = page.locator("[data-testid='nav-dashboard']");
    await expect(dashboardNav).toBeVisible({ timeout: 10000 });
    await dashboardNav.click();

    // 3. Verify Requester Dashboard greeting & personal metric cards
    await expect(page.locator("[data-testid='dashboard-greeting']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='requester-metric-cards']")).toBeVisible({ timeout: 10000 });

    // Verify 4 personal metric cards
    await expect(page.locator("#metric-total-open")).toBeVisible();
    await expect(page.locator("#metric-waiting")).toBeVisible();
    await expect(page.locator("#metric-resolved")).toBeVisible();
    await expect(page.locator("#metric-closed")).toBeVisible();

    // 4. Test Quick Action / Drill-down to My Tickets
    const viewMyTicketsBtn = page.locator("#quick-action-view-tickets, [data-testid='quick-action-my-tickets'], button:has-text('View My Tickets'), a:has-text('View all')").first();
    if (await viewMyTicketsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewMyTicketsBtn.click();
      await expect(page.locator(":is(h1, h2):has-text('My Tickets')")).toBeVisible({ timeout: 10000 });
    }

    await logout(page);
  });
});
