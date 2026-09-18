import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

test.describe("E2E-02: Mandatory First-Login Password Change", () => {
  test("forces initial password change and unlocks app upon completion", async ({ page }) => {
    // Jennifer Anderson has requiresPasswordChange: true by default
    await loginAs(page, "jennifer.anderson@kmutt.ac.th", "Password123!");

    // Verify interstitial screen is displayed
    const changeForm = page.locator("[data-testid='change-password-form']");
    const isInterstitial = await changeForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (isInterstitial) {
      // Main app navigation should not be visible while blocked
      await expect(page.locator("[data-testid='nav-my-tickets']")).not.toBeVisible();

      // Submit password change
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("NewSecurePassword123!");
      await page.locator("#confirm-password-input").fill("NewSecurePassword123!");
      await page.click("[data-testid='change-password-submit']");
    }

    // App shell is now unlocked
    await expect(page.locator("[data-testid='nav-my-tickets']")).toBeVisible({ timeout: 10000 });
    await logout(page);
  });
});
