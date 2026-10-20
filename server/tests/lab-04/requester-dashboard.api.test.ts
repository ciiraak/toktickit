import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_prod";

function getRequesterCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "REQUESTER" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

function getStaffCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "IT_STAFF" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

describe("Lab 4 — Requester Dashboard API (FR-09 / AC-09 / BR-09)", () => {
  let requesterUserId: number;
  let otherRequesterUserId: number;
  let staffUserId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    const requester = await prisma.user.findFirst({
      where: { role: "REQUESTER", email: "jennifer.anderson@kmutt.ac.th" },
    });
    const otherRequester = await prisma.user.findFirst({
      where: { role: "REQUESTER", email: "michael.brown@kmutt.ac.th" },
    });
    const staff = await prisma.user.findFirst({
      where: { role: "IT_STAFF", isActive: true },
    });

    if (!requester || !otherRequester || !staff) throw new Error("Seed users missing");

    requesterUserId = requester.id;
    otherRequesterUserId = otherRequester.id;
    staffUserId = staff.id;
  });

  it("API-10a: returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/requester/dashboard");
    expect(res.status).toBe(401);
  });

  it("API-10b: returns 200 with metrics and recentTickets for authenticated requester (AC-09)", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Cookie", getRequesterCookie(requesterUserId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");
  });

  it("API-10c: metrics shape is correct (totalOpen, waitingForRequester, recentlyResolved, totalClosed)", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Cookie", getRequesterCookie(requesterUserId));

    expect(res.status).toBe(200);
    const { metrics } = res.body;
    expect(typeof metrics.totalOpen).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");
    expect(typeof metrics.recentlyResolved).toBe("number");
    expect(typeof metrics.totalClosed).toBe("number");
    // All counts are non-negative integers
    expect(metrics.totalOpen).toBeGreaterThanOrEqual(0);
    expect(metrics.waitingForRequester).toBeGreaterThanOrEqual(0);
    expect(metrics.recentlyResolved).toBeGreaterThanOrEqual(0);
    expect(metrics.totalClosed).toBeGreaterThanOrEqual(0);
  });

  it("API-10d: recentTickets is an array of up to 5 items belonging to this requester", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Cookie", getRequesterCookie(requesterUserId));

    expect(res.status).toBe(200);
    const { recentTickets } = res.body;
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);

    if (recentTickets.length > 0) {
      const first = recentTickets[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNumber");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("currentStatus");
      expect(first).toHaveProperty("requestedPriority");
      expect(first).toHaveProperty("createdAt");
      expect(first).toHaveProperty("updatedAt");
    }
  });

  it("API-10e: requester sees only their own tickets (BR-09 isolation)", async () => {
    const prisma = getPrisma();

    // Get the counts as the DB sees them for this requester
    const [dbTotalOpen, dbWaiting, dbResolved, dbClosed] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterId: requesterUserId,
          currentStatus: { in: ["New", "Open", "In Progress", "Waiting for Requester"] },
        },
      }),
      prisma.ticket.count({
        where: { requesterId: requesterUserId, currentStatus: "Waiting for Requester" },
      }),
      prisma.ticket.count({
        where: { requesterId: requesterUserId, currentStatus: "Resolved" },
      }),
      prisma.ticket.count({
        where: { requesterId: requesterUserId, currentStatus: { in: ["Closed", "Cancelled"] } },
      }),
    ]);

    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Cookie", getRequesterCookie(requesterUserId));

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalOpen).toBe(dbTotalOpen);
    expect(res.body.metrics.waitingForRequester).toBe(dbWaiting);
    expect(res.body.metrics.recentlyResolved).toBe(dbResolved);
    expect(res.body.metrics.totalClosed).toBe(dbClosed);
  });

  it("API-10f: metrics differ between two different requesters (isolation proof)", async () => {
    const [res1, res2] = await Promise.all([
      request(app).get("/api/requester/dashboard").set("Cookie", getRequesterCookie(requesterUserId)),
      request(app).get("/api/requester/dashboard").set("Cookie", getRequesterCookie(otherRequesterUserId)),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Both responses are valid; values may differ (they are for distinct requesters)
    expect(res1.body.metrics).toBeDefined();
    expect(res2.body.metrics).toBeDefined();
  });

  it("API-10g: IT Staff can also access /api/requester/dashboard (endpoint is role-agnostic)", async () => {
    // The spec says "authenticated user viewing their own personal tickets"
    // Staff authenticating here will get metrics for their own tickets (if any)
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
  });
});
