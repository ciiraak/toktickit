import { Page, expect } from "@playwright/test";

export async function navigateToLogin(page: Page) {
  await page.goto("/?mode=login");
  const signInBtn = page.locator("button:has-text('Sign In (Lab 3)')");
  if (await signInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signInBtn.click();
  }
  await page.waitForSelector("form[data-testid='login-form'], #email-input", { timeout: 10000 });
}

export async function loginAs(page: Page, email: string, password = "Password123!") {
  await navigateToLogin(page);
  await page.locator("#email-input").fill(email);
  await page.locator("#password-input").fill(password);
  await page.locator("[data-testid='login-submit-button']").click();

  // If login fails due to password changed in previous test runs, try alt passwords
  const errorBanner = page.locator("[data-testid='login-error-banner']");
  if (await errorBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
    for (const altPwd of ["NewSecurePassword123!", "Lab4Password123!", "StaffPassword123!"]) {
      await page.locator("#password-input").fill(altPwd);
      await page.locator("[data-testid='login-submit-button']").click();
      const stillError = await errorBanner.isVisible({ timeout: 1500 }).catch(() => false);
      if (!stillError) break;
    }
  }

  // Handle first-login password change if shown
  const changeForm = page.locator("[data-testid='change-password-form']");
  if (await changeForm.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.locator("#current-password-input").fill(password);
    await page.locator("#new-password-input").fill("Lab4Password123!");
    await page.locator("#confirm-password-input").fill("Lab4Password123!");
    await page.click("[data-testid='change-password-submit']");
  }

  await page.waitForSelector(".app-header", { timeout: 15000 });
}

export async function logout(page: Page) {
  const logoutBtn = page.locator("[data-testid='logout-button'], button:has-text('Sign Out')");
  if (await logoutBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(500);
  }
}
