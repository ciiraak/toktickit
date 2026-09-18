import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-04: Administrator User Management Flow", () => {
  test("creates a new user and filters directory by role", async ({ page }) => {
    await loginAs(page, "admin@kmutt.ac.th", "Password123!");

    // Handle initial password change if needed
    const changePwdForm = page.locator("[data-testid='change-password-form']");
    if (await changePwdForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("AdminPassword123!");
      await page.locator("#confirm-password-input").fill("AdminPassword123!");
      await page.click("[data-testid='change-password-submit']");
    }

    // Navigate to User Management
    const adminNav = page.locator("[data-testid='nav-admin-users']");
    await expect(adminNav).toBeVisible({ timeout: 10000 });
    await adminNav.click();

    // Verify User Management header
    await expect(page.locator("h2:has-text('User Management')")).toBeVisible({ timeout: 10000 });

    // Open Create User Modal
    await page.click("[data-testid='create-user-button']");
    await expect(page.locator("h5:has-text('Create New User')")).toBeVisible({ timeout: 5000 });

    // Fill Create User Form
    const timestamp = Date.now();
    const newUserEmail = `e2e.user.${timestamp}@kmutt.ac.th`;
    await page.locator("[data-testid='create-name-input']").fill("E2E Test User");
    await page.locator("[data-testid='create-email-input']").fill(newUserEmail);
    await page.locator("[data-testid='create-role-select']").selectOption("IT_STAFF");
    await page.locator("[data-testid='create-password-input']").fill("InitialTemp123!");

    // Submit
    await page.click("[data-testid='submit-create-user']");

    // Verify success banner appears
    await expect(page.locator("[data-testid='success-banner']")).toBeVisible({ timeout: 10000 });

    // Filter by Role
    await page.locator("[data-testid='role-filter-select']").selectOption("IT_STAFF");
    await expect(page.locator("text=IT Staff")).toBeVisible({ timeout: 8000 });

    await logout(page);
  });
});
