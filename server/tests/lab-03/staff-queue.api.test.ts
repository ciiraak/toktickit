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

function getRequesterCookie(userId: number) {
  const token = jwt.sign({ id: userId, role: "REQUESTER" }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

describe("Lab 3 - Staff Ticket Queue API", () => {
  let staffUserId: number;
  let requesterUserId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const staff = await prisma.user.findFirst({ where: { role: "IT_STAFF", isActive: true } });
    const requester = await prisma.user.findFirst({ where: { role: "REQUESTER", isActive: true } });
    if (!staff || !requester) throw new Error("Seed data missing");
    staffUserId = staff.id;
    requesterUserId = requester.id;
  });

  describe("GET /api/staff/tickets — Queue", () => {
    it("returns 200 and paginated ticket list for IT staff", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("tickets");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.tickets)).toBe(true);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/staff/tickets");
      expect(res.status).toBe(401);
    });

    it("returns 403 when called by a Requester", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", getRequesterCookie(requesterUserId));
      expect(res.status).toBe(403);
    });

    it("filters by status correctly", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?status=New")
        .set("Cookie", getStaffCookie(staffUserId));
      expect(res.status).toBe(200);
      const allNew = res.body.tickets.every((t: any) => t.currentStatus === "New");
      expect(allNew).toBe(true);
    });

    it("handles pagination parameters", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=1&limit=5")
        .set("Cookie", getStaffCookie(staffUserId));
      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.tickets.length).toBeLessThanOrEqual(5);
    });

    it("filters by search term", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=TKT")
        .set("Cookie", getStaffCookie(staffUserId));
      expect(res.status).toBe(200);
      // All returned tickets should match 'TKT' in ticket number or summary
      const allMatch = res.body.tickets.every(
        (t: any) =>
          t.ticketNumber.includes("TKT") ||
          t.summary.toLowerCase().includes("tkt")
      );
      expect(allMatch).toBe(true);
    });
  });

  describe("GET /api/staff/tickets/:id — Detail", () => {
    it("returns 404 for non-existent ticket", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/999999")
        .set("Cookie", getStaffCookie(staffUserId));
      expect(res.status).toBe(404);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/staff/tickets/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 when called by a Requester", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/1")
        .set("Cookie", getRequesterCookie(requesterUserId));
      expect(res.status).toBe(403);
    });
  });
});
