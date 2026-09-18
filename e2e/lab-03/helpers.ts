import { Page, expect } from "@playwright/test";

export async function navigateToLogin(page: Page) {
  await page.goto("/?mode=login");
  const signInBtn = page.locator("button:has-text('Sign In (Lab 3)')");
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
  }
  await page.waitForSelector("form[data-testid='login-form'], #email-input", { timeout: 10000 });
}

export async function loginAs(page: Page, email: string, password = "Password123!") {
  await navigateToLogin(page);
  await page.locator("#email-input").fill(email);
  await page.locator("#password-input").fill(password);
  await page.click("button[data-testid='login-submit-button'], button:has-text('Sign In')");
}

export async function logout(page: Page) {
  const logoutBtn = page.locator("button[data-testid='logout-button'], button:has-text('Sign Out')");
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
}
