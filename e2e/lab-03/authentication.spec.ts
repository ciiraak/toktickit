import { test, expect } from "@playwright/test";
import { loginAs, logout, navigateToLogin } from "./helpers";

test.describe("E2E-01: Authentication Flow", () => {
  test("shows error banner on invalid credentials", async ({ page }) => {
    await loginAs(page, "admin@kmutt.ac.th", "WrongPassword123!");
    const errorBanner = page.locator("[data-testid='login-error-banner']");
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
    await expect(errorBanner).toContainText(/invalid email or password/i);
  });

  test("logs in as IT Staff, sees role navigation, and logs out successfully", async ({ page }) => {
    await loginAs(page, "staff1@kmutt.ac.th", "Password123!");

    // If first login screen appears, change password to continue
    const changePwdForm = page.locator("[data-testid='change-password-form']");
    if (await changePwdForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("StaffPassword123!");
      await page.locator("#confirm-password-input").fill("StaffPassword123!");
      await page.click("[data-testid='change-password-submit']");
    }

    // Confirm App Shell loads with IT Staff navigation
    await expect(page.locator("[data-testid='nav-my-tickets']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='nav-staff-queue']")).toBeVisible();

    // Logout
    await logout(page);

    // Verify redirected back to login screen
    await expect(page.locator("[data-testid='login-form'], #email-input")).toBeVisible({ timeout: 10000 });
  });

  test("logs in as Administrator and sees User Management navigation", async ({ page }) => {
    await loginAs(page, "admin@kmutt.ac.th", "Password123!");

    // If first login screen appears, change password to continue
    const changePwdForm = page.locator("[data-testid='change-password-form']");
    if (await changePwdForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("AdminPassword123!");
      await page.locator("#confirm-password-input").fill("AdminPassword123!");
      await page.click("[data-testid='change-password-submit']");
    }

    // Confirm Admin has access to User Management
    await expect(page.locator("[data-testid='nav-admin-users']")).toBeVisible({ timeout: 10000 });
    await logout(page);
  });
});
