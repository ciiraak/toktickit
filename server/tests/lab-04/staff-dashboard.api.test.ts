import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_prod";

function getStaffCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "IT_STAFF" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

function getAdminCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "ADMINISTRATOR" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

function getRequesterCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "REQUESTER" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

describe("Lab 4 — Staff Dashboard API (FR-10 / AC-10 / BR-10)", () => {
  let staffUserId: number;
  let adminUserId: number;
  let requesterUserId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    const staff = await prisma.user.findFirst({
      where: { role: "IT_STAFF", isActive: true },
    });
    const admin = await prisma.user.findFirst({
      where: { role: "ADMINISTRATOR", isActive: true },
    });
    const requester = await prisma.user.findFirst({
      where: { role: "REQUESTER", email: "jennifer.anderson@kmutt.ac.th" },
    });

    if (!staff || !admin || !requester) throw new Error("Seed users missing");

    staffUserId = staff.id;
    adminUserId = admin.id;
    requesterUserId = requester.id;
  });

  it("API-11a: returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/staff/dashboard");
    expect(res.status).toBe(401);
  });

  it("API-11b: returns 403 when accessed by a Requester", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getRequesterCookie(requesterUserId));
    expect(res.status).toBe(403);
  });

  it("API-11c: returns 200 for authenticated IT Staff (AC-10)", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));
    expect(res.status).toBe(200);
  });

  it("API-11d: returns 200 for authenticated Administrator", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getAdminCookie(adminUserId));
    expect(res.status).toBe(200);
  });

  it("API-11e: response contains metrics, urgentTickets, recentTickets", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("urgentTickets");
    expect(res.body).toHaveProperty("recentTickets");
  });

  it("API-11f: metrics shape is correct (new, open, inProgress, waitingForRequester, myAssigned, unassigned)", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));

    expect(res.status).toBe(200);
    const { metrics } = res.body;
    expect(typeof metrics.new).toBe("number");
    expect(typeof metrics.open).toBe("number");
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.waitingForRequester).toBe("number");
    expect(typeof metrics.myAssigned).toBe("number");
    expect(typeof metrics.unassigned).toBe("number");
    // All non-negative
    expect(metrics.new).toBeGreaterThanOrEqual(0);
    expect(metrics.open).toBeGreaterThanOrEqual(0);
    expect(metrics.inProgress).toBeGreaterThanOrEqual(0);
    expect(metrics.waitingForRequester).toBeGreaterThanOrEqual(0);
    expect(metrics.myAssigned).toBeGreaterThanOrEqual(0);
    expect(metrics.unassigned).toBeGreaterThanOrEqual(0);
  });

  it("API-11g: metrics match DB counts (BR-10)", async () => {
    const prisma = getPrisma();

    // Query DB and API concurrently so they see the same snapshot
    const [
      dbNew, dbOpen, dbInProgress, dbWaiting, dbMyAssigned, dbUnassigned, res,
    ] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: "New" } }),
      prisma.ticket.count({ where: { currentStatus: "Open" } }),
      prisma.ticket.count({ where: { currentStatus: "In Progress" } }),
      prisma.ticket.count({ where: { currentStatus: "Waiting for Requester" } }),
      prisma.ticket.count({
        where: { ownerId: staffUserId, currentStatus: { notIn: ["Closed", "Cancelled"] } },
      }),
      prisma.ticket.count({
        where: { ownerId: null, currentStatus: { notIn: ["Closed", "Cancelled"] } },
      }),
      request(app)
        .get("/api/staff/dashboard")
        .set("Cookie", getStaffCookie(staffUserId)),
    ]);

    expect(res.status).toBe(200);
    expect(res.body.metrics.new).toBe(dbNew);
    expect(res.body.metrics.open).toBe(dbOpen);
    expect(res.body.metrics.inProgress).toBe(dbInProgress);
    expect(res.body.metrics.waitingForRequester).toBe(dbWaiting);
    expect(res.body.metrics.myAssigned).toBe(dbMyAssigned);
    expect(res.body.metrics.unassigned).toBe(dbUnassigned);
  });

  it("API-11h: recentTickets has up to 5 items with correct shape", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));

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
      expect(first).toHaveProperty("requesterName");
      expect(first).toHaveProperty("createdAt");
      expect(first).toHaveProperty("updatedAt");
    }
  });

  it("API-11i: urgentTickets has up to 5 items and all have HIGH priority or active status", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Cookie", getStaffCookie(staffUserId));

    expect(res.status).toBe(200);
    const { urgentTickets } = res.body;
    expect(Array.isArray(urgentTickets)).toBe(true);
    expect(urgentTickets.length).toBeLessThanOrEqual(5);

    if (urgentTickets.length > 0) {
      const terminalStatuses = ["Closed", "Cancelled"];
      for (const ticket of urgentTickets) {
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("requesterName");
        // Must be a non-terminal status
        expect(terminalStatuses).not.toContain(ticket.currentStatus);
        // At least one priority must be HIGH
        const isHighPriority = ticket.itPriority === "HIGH" || ticket.requestedPriority === "HIGH";
        expect(isHighPriority).toBe(true);
      }
    }
  });

  it("API-11j: myAssigned count is scoped to the authenticated user", async () => {
    const prisma = getPrisma();

    const staffMyAssigned = await prisma.ticket.count({
      where: { ownerId: staffUserId, currentStatus: { notIn: ["Closed", "Cancelled"] } },
    });
    const adminMyAssigned = await prisma.ticket.count({
      where: { ownerId: adminUserId, currentStatus: { notIn: ["Closed", "Cancelled"] } },
    });

    const [staffRes, adminRes] = await Promise.all([
      request(app).get("/api/staff/dashboard").set("Cookie", getStaffCookie(staffUserId)),
      request(app).get("/api/staff/dashboard").set("Cookie", getAdminCookie(adminUserId)),
    ]);

    expect(staffRes.body.metrics.myAssigned).toBe(staffMyAssigned);
    expect(adminRes.body.metrics.myAssigned).toBe(adminMyAssigned);
  });
});
