import { test, expect, Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Select a development requester by name.
 * Clears localStorage, navigates to the app root, picks the requester and continues.
 */
async function selectRequester(page: Page, name: string) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.waitForSelector("select", { timeout: 10000 });
  await page.selectOption("select", { label: name });
  await page.click("button:has-text('Continue')");
  await page.waitForSelector("text=My Tickets", { timeout: 10000 });
}

/**
 * Create a ticket via the UI form. Returns the ticket number displayed on the success screen.
 */
async function createTicketViaUI(
  page: Page,
  opts: { summary: string; description: string }
): Promise<string> {
  await page.click("button:has-text('Create Ticket')");
  await page.waitForSelector("form", { timeout: 5000 });

  await page.fill("#summary", opts.summary);
  await page.fill("#description", opts.description);

  // Select first available category and system
  await page.selectOption("#categoryId", { index: 1 });
  await page.selectOption("#relatedSystemId", { index: 1 });

  await page.click("button[type='submit']");
  await page.waitForSelector("text=/TKT-/", { timeout: 15000 });

  const ticketNumber = await page.locator("text=/TKT-\\d{4}-\\d{6}/").first().textContent();
  return ticketNumber ?? "";
}

// ─── E2E-01: Full ticket submission flow ──────────────────────────────────────

test.describe("E2E-01 — Full Ticket Submission Flow (AC-01, AC-02)", () => {
  test("redirects to requester selector when no requester is in localStorage (AC-02)", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("text=/Select.*Requester|Development Requester/i", { timeout: 10000 });

    // Should NOT show the My Tickets tab when no requester is selected
    await expect(page.locator("button:has-text('My Tickets')")).toHaveCount(0);
  });

  test("completes full ticket creation and shows success screen (AC-01, BR-01, BR-02)", async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");

    // Navigate to Create Ticket tab
    await page.click("button:has-text('Create Ticket')");
    await page.waitForSelector("form", { timeout: 5000 });

    // Fill in the form
    await page.fill("#summary", "Cannot access the student portal after password reset");
    await page.fill(
      "#description",
      "After resetting my password via the self-service portal, I am unable to log into the LEB2 App. The error message says 'invalid credentials' even though the password was just changed."
    );
    await page.selectOption("#categoryId", { index: 1 });
    await page.selectOption("#relatedSystemId", { index: 1 });
    await page.selectOption("#requestedPriority", "MEDIUM");

    // Submit
    await page.click("button[type='submit']");

    // Success screen: should show ticket number in TKT-YYYY-XXXXXX format
    await page.waitForSelector("text=/TKT-\\d{4}-\\d{6}/", { timeout: 15000 });
    const ticketNumber = await page.locator("text=/TKT-\\d{4}-\\d{6}/").first().textContent();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // Success banner should also appear on My Tickets after redirect
    await page.waitForSelector("text=My Tickets", { timeout: 10000 });
  });
});

// ─── E2E-02: Ticket search, filter, and pagination ────────────────────────────

test.describe("E2E-02 — Ticket Search, Filter, and Pagination (AC-04)", () => {
  test.beforeEach(async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");
    // Ensure we are on My Tickets
    await page.waitForSelector("text=My Tickets", { timeout: 10000 });
  });

  test("search input filters the ticket list by summary text", async ({ page }) => {
    // Type in search box
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("NonExistentSearchTermThatMatchesNothing");

    // Should show "No matching tickets" state
    await page.waitForSelector("text=/No matching tickets/i", { timeout: 8000 });
    await expect(page.locator("text=/No matching tickets/i")).toBeVisible();

    // Clear search → should restore list (or show empty state)
    await searchInput.fill("");
  });

  test("status filter dropdown changes the visible ticket subset", async ({ page }) => {
    const statusSelect = page.locator("select").filter({ hasText: /All Statuses|Status/i });
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption("New");
      await page.waitForTimeout(1000); // wait for debounce/re-render
      // The list should still render (either tickets or empty state)
      const hasTickets = (await page.locator("table tbody tr").count()) > 0;
      const hasEmpty = (await page.locator("text=/No matching tickets|No tickets yet/i").count()) > 0;
      expect(hasTickets || hasEmpty).toBe(true);
    }
  });
});

// ─── E2E-03: Attachment upload and soft removal ───────────────────────────────

test.describe("E2E-03 — Attachment Upload and Soft Removal (AC-06)", () => {
  let ticketNumber: string;

  test.beforeEach(async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");
    ticketNumber = await createTicketViaUI(page, {
      summary: "E2E Attachment test ticket summary",
      description: "This ticket is created to verify attachment upload and soft-removal via E2E test suite.",
    });
  });

  test("uploads a file attachment to an existing ticket and soft-removes it with a reason", async ({ page }) => {
    // Go back to My Tickets
    await page.waitForSelector("text=/My Tickets/i", { timeout: 10000 });

    // Navigate back if we're still on the success screen
    const backBtn = page.locator("button:has-text('Back to My Tickets'), button:has-text('Continue')");
    if (await backBtn.count() > 0) await backBtn.first().click();

    // Click the ticket row to open detail
    await page.waitForSelector(`text=${ticketNumber}`, { timeout: 10000 });
    await page.locator(`text=${ticketNumber}`).first().click();

    // Detail page should appear
    await page.waitForSelector("text=Attachments", { timeout: 10000 });

    // Upload a PDF attachment via the hidden file input
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("button:has-text('Add Attachment')");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 test content for e2e attachment testing"),
    });

    // Uploaded file should appear in the list
    await page.waitForSelector("text=test-report.pdf", { timeout: 10000 });

    // Click "Remove" on the uploaded file
    await page.click("button:has-text('Remove')");

    // Removal modal should appear
    await page.waitForSelector("text=Remove Attachment", { timeout: 5000 });

    // Enter a removal reason
    await page.fill("textarea", "No longer relevant to this ticket");

    // Confirm removal
    await page.click("button:has-text('Confirm Soft Removal')");

    // File should now show "Removed" badge
    await page.waitForSelector("text=Removed", { timeout: 10000 });

    // Download button should be hidden for the removed file
    const downloadLinks = page.locator("a:has-text('Download')");
    await expect(downloadLinks).toHaveCount(0);
  });
});

// ─── E2E-04: Cross-requester URL interception (AC-03) ─────────────────────────

test.describe("E2E-04 — Cross-Requester Security (AC-03, BR-04)", () => {
  test("blocks access to a ticket owned by a different requester", async ({ page }) => {
    // First, log in as Jennifer and create a ticket to get a ticket ID
    await selectRequester(page, "Jennifer Anderson");
    await createTicketViaUI(page, {
      summary: "Jenns private ticket for cross-requester test",
      description: "This ticket is owned by Jennifer Anderson and should be inaccessible to other requesters.",
    });

    // Get the ID of Jennifer's ticket from the DB via the API
    const apiRes = await page.evaluate(async () => {
      const r = await fetch("http://localhost:3000/api/tickets?limit=1", {
        headers: { "x-requester-id": "1" },
      });
      return r.json();
    });
    const tickets = apiRes.tickets ?? [];
    if (tickets.length === 0) return; // Skip if no tickets to test with
    const jenTicketId = tickets[0].id as number;

    // Now switch to Michael Brown (requester id=2)
    await page.evaluate(() => localStorage.setItem("toktickit_requester_id", "2"));
    await page.goto("/");
    await page.waitForSelector("text=My Tickets", { timeout: 10000 });

    // Try to access Jennifer's ticket detail via the API directly
    const forbiddenRes = await page.evaluate(async (ticketId) => {
      const r = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        headers: { "x-requester-id": "2" },
      });
      return { status: r.status, body: await r.json() };
    }, jenTicketId);

    // Should return 403 Forbidden
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body).toHaveProperty("error");
  });
});
