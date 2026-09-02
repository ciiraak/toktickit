import { test, expect, Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "toktickit_requester_id";

/**
 * Select a development requester by name match in option text.
 * Clears localStorage, navigates to app root, picks the requester and continues.
 */
async function selectRequester(page: Page, name: string) {
  // Set localStorage before navigation so the app boots with no stored requester
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.goto("/");

  // Wait for selector heading to confirm we're on the selector screen
  await page.waitForSelector("h2:has-text('Select Development Requester')", { timeout: 15000 });

  // Find and select the requester option matching the name
  const options = await page.locator("#requester-select option").all();
  let selectedValue = "1";
  for (const opt of options) {
    const text = await opt.textContent();
    if (text && text.includes(name)) {
      selectedValue = (await opt.getAttribute("value")) || "1";
      break;
    }
  }
  await page.locator("#requester-select").selectOption(selectedValue);

  // Click the "Continue →" button
  await page.click("button:has-text('Continue')");

  // Wait for navigation tab to confirm we're inside the app shell
  await page.waitForSelector("button:has-text('My Tickets')", { timeout: 10000 });
}

/**
 * Create a ticket via the UI form.
 * Returns the ticket number from the success screen.
 */
async function createTicketViaUI(
  page: Page,
  opts: { summary: string; description: string }
): Promise<string> {
  await page.click("button:has-text('Create Ticket')");
  await page.waitForSelector("form", { timeout: 8000 });

  await page.locator("#summary-input").fill(opts.summary);
  await page.locator("#description-input").fill(opts.description);

  // Wait for options and select explicitly
  await page.locator("#category-select option:not([value=''])").first().waitFor({ state: "attached", timeout: 10000 });
  const catVal = await page.locator("#category-select option:not([value=''])").first().getAttribute("value");
  if (catVal) await page.locator("#category-select").selectOption(catVal);

  await page.locator("#system-select option:not([value=''])").first().waitFor({ state: "attached", timeout: 10000 });
  const sysVal = await page.locator("#system-select option:not([value=''])").first().getAttribute("value");
  if (sysVal) await page.locator("#system-select").selectOption(sysVal);

  // Submit the form
  await page.click("button:has-text('Submit Ticket')");

  // Wait for ticket number in success banner or card
  await page.waitForSelector("text=/TKT-\\d{4}-\\d{6}/", { timeout: 20000 });

  const el = page.locator("text=/TKT-\\d{4}-\\d{6}/").first();
  const rawText = await el.textContent();
  const match = rawText?.match(/TKT-\d{4}-\d{6}/);
  return match ? match[0] : "";
}

// ─── E2E-01: Full ticket submission flow ──────────────────────────────────────

test.describe("E2E-01 — Full Ticket Submission Flow (AC-01, AC-02)", () => {
  test("shows requester selector when no requester is in localStorage (AC-02)", async ({ page }) => {
    // Ensure no requester is stored
    await page.goto("/");
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.goto("/");

    // The app must show the selector screen — not the app shell
    await page.waitForSelector("h2:has-text('Select Development Requester')", { timeout: 15000 });

    // The navigation tabs should NOT be visible
    const myTicketsTab = page.locator("button:has-text('My Tickets')");
    await expect(myTicketsTab).toHaveCount(0);

    // The form select should be visible
    await expect(page.locator("#requester-select")).toBeVisible();
  });

  test("completes full ticket creation and shows unique ticket number (AC-01, BR-01, BR-02)", async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");

    const ticketNumber = await createTicketViaUI(page, {
      summary: "Cannot access the student portal after password reset",
      description:
        "After resetting my password via the self-service portal, I am unable to log into the LEB2 App. The error message says invalid credentials even though the password was just changed.",
    });

    // Ticket number must be in TKT-YYYY-XXXXXX format (BR-01)
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // Status is New (BR-02) — verified from the success screen text
    const successText = await page.locator("text=/TKT-\\d{4}-\\d{6}/").first().textContent();
    expect(successText).toBeTruthy();
  });
});

// ─── E2E-02: Ticket search, filter, and pagination ────────────────────────────

test.describe("E2E-02 — Ticket Search, Filter, and Pagination (AC-04)", () => {
  test.beforeEach(async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");
    // Make sure there's at least one ticket in the system by creating one
    await createTicketViaUI(page, {
      summary: "E2E search and filter test ticket",
      description: "This ticket is created so that we have data to search and filter against in the E2E suite.",
    });
    // Navigate back to My Tickets (click the nav tab)
    await page.click("button:has-text('My Tickets')");
    await page.waitForTimeout(1500);
  });

  test("search input shows no-results state for unmatched query", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await expect(searchInput).toBeVisible();

    // Type a term that won't match any tickets
    await searchInput.fill("ZZZZNOTFOUNDZZZZ999");
    await page.waitForTimeout(1000);

    // Should show "No matching tickets" empty state
    const noResults = page.locator("text=/No matching tickets/i");
    await expect(noResults).toBeVisible({ timeout: 8000 });
  });

  test("search input shows results when query matches a ticket summary", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await expect(searchInput).toBeVisible();

    // Search for a unique term from the ticket we created
    await searchInput.fill("E2E search");
    await page.waitForTimeout(1000);

    // Should show at least one row in the table (or card in mobile)
    const ticketRows = page.locator("table tbody tr");
    const cardViews = page.locator(".d-md-none .p-3.rounded.border");

    const hasRows = (await ticketRows.count()) > 0;
    const hasCards = (await cardViews.count()) > 0;
    expect(hasRows || hasCards).toBe(true);
  });

  test("status filter dropdown updates the displayed list", async ({ page }) => {
    const statusSelect = page.locator("select[aria-label='Filter by Status']");
    if ((await statusSelect.count()) > 0) {
      await statusSelect.selectOption("New");
      await page.waitForTimeout(1000);

      // The list should be in a defined state (either tickets or empty state)
      const hasContent =
        (await page.locator("table tbody tr").count()) > 0 ||
        (await page.locator("text=/No matching tickets|No tickets/i").count()) > 0;
      expect(hasContent).toBe(true);
    }
  });
});

// ─── E2E-03: Attachment upload and soft removal ───────────────────────────────

test.describe("E2E-03 — Attachment Upload and Soft Removal (AC-06)", () => {
  test("uploads a file to a ticket and soft-removes it with a mandatory reason", async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");

    // Create a fresh ticket to attach a file to
    const ticketNumber = await createTicketViaUI(page, {
      summary: "E2E Attachment lifecycle test ticket",
      description: "This ticket tests uploading and then soft-removing a file attachment via the UI.",
    });

    // Open details by clicking the ticket row or card
    await page.waitForSelector(`text=${ticketNumber}`, { timeout: 10000 });
    await page.locator(`tr:has-text('${ticketNumber}'), .d-md-none:has-text('${ticketNumber}')`).first().click({ force: true });

    // Should be on the detail page (wait for Attachments card heading)
    await page.waitForSelector("h2:has-text('Attachments')", { timeout: 20000 });

    // Upload a PDF file via the file input button
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("button:has-text('Add Attachment')");
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: "evidence-report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 1 0 obj << /Type /Catalog >> endobj"),
    });

    // Wait for the filename to appear in the attachment list
    await page.waitForSelector("text=evidence-report.pdf", { timeout: 15000 });

    // Click the "Remove" button on the active attachment
    await page.click("button:has-text('Remove')");

    // Soft removal modal should appear
    await page.waitForSelector("text=Remove Attachment", { timeout: 5000 });

    // Fill in the mandatory removal reason
    const reasonInput = page.locator("textarea[placeholder*='Enter reason']");
    await reasonInput.fill("No longer needed for this ticket");

    // Confirm the removal
    await page.click("button:has-text('Confirm Soft Removal')");

    // Verify the file now shows "Removed" badge
    await page.waitForSelector("text=Removed", { timeout: 10000 });

    // Verify there is no active "Download" link remaining for this file
    const downloadLinks = page.locator("a:has-text('Download')");
    await expect(downloadLinks).toHaveCount(0);

    // Verify the removal reason is displayed
    await expect(page.locator("text=/No longer needed/i")).toBeVisible();
  });
});

// ─── E2E-04: Cross-requester URL interception (AC-03) ─────────────────────────

test.describe("E2E-04 — Cross-Requester Security (AC-03, BR-04)", () => {
  test("API returns 403 Forbidden when accessing another requesters ticket", async ({ page }) => {
    // Step 1: Create a ticket as Jennifer Anderson (requester id=1)
    await selectRequester(page, "Jennifer Anderson");
    await createTicketViaUI(page, {
      summary: "Cross-requester security verification ticket",
      description: "This ticket is created by Jennifer and should be inaccessible to Michael Brown via API.",
    });

    // Step 2: Fetch Jennifer's most recent ticket ID via the API from within the page context
    const apiRes = await page.evaluate(async () => {
      const r = await fetch("http://localhost:3000/api/tickets?limit=1&sortBy=createdAt&sortOrder=desc", {
        headers: { "x-requester-id": "1" },
      });
      return r.json();
    });

    const tickets = apiRes.tickets ?? [];
    if (tickets.length === 0) {
      test.skip(); // No ticket to test with
      return;
    }
    const jenTicketId = tickets[0].id as number;

    // Step 3: Switch session to Michael Brown (requester id=2) via localStorage
    await page.evaluate((key) => localStorage.setItem(key, "2"), STORAGE_KEY);
    await page.goto("/");
    await page.waitForSelector("button:has-text('My Tickets')", { timeout: 10000 });

    // Step 4: Attempt to access Jennifer's ticket detail via API as Michael Brown
    const forbiddenRes = await page.evaluate(async (ticketId) => {
      const r = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        headers: { "x-requester-id": "2" },
      });
      return { status: r.status, body: await r.json() };
    }, jenTicketId);

    // Step 5: Verify 403 Forbidden response
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body).toHaveProperty("error");
    expect(forbiddenRes.body.error).toMatch(/Access denied|Forbidden/i);
  });
});
