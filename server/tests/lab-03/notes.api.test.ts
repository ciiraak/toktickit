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

describe("Lab 3 - Staff Ticket Operations & Notes API", () => {
  let staffUserId: number;
  let requesterUserId: number;
  let otherRequesterUserId: number;
  let testTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const staff = await prisma.user.findFirst({ where: { role: "IT_STAFF", isActive: true } });
    const requesters = await prisma.user.findMany({ where: { role: "REQUESTER", isActive: true }, take: 2 });
    if (!staff || requesters.length < 2) throw new Error("Seed data missing");

    staffUserId = staff.id;
    requesterUserId = requesters[0].id;
    otherRequesterUserId = requesters[1].id;

    // Create a fresh test ticket
    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${Date.now().toString().slice(-6)}`,
        requesterId: requesterUserId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Operations Test Ticket",
        description: "Testing staff operations, comments, and internal notes.",
        requestedPriority: "MEDIUM",
        currentStatus: "New",
      },
    });
    testTicketId = ticket.id;
  });

  describe("GET /api/staff/tickets/:id", () => {
    it("returns ticket detail including comments and notes for IT staff", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicketId);
      expect(res.body).toHaveProperty("comments");
      expect(res.body).toHaveProperty("notes");
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(Array.isArray(res.body.notes)).toBe(true);
    });

    it("returns 403 when called by a Requester", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getRequesterCookie(requesterUserId));

      expect(res.status).toBe(403);
    });

    it("returns 404 for non-existent ticket", async () => {
      const res = await request(app)
        .get("/api/staff/tickets/999999")
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/staff/tickets/:id/internal-notes", () => {
    it("allows IT staff to append an internal note (AC-06)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ content: "Investigated network switch, port flapping observed." });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.content).toBe("Investigated network switch, port flapping observed.");
      expect(res.body.authorId).toBe(staffUserId);
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("rejects empty note content with 400", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    it("returns 403 Forbidden for Requester (API-04 / AC-04)", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ content: "Requester trying to write internal note" });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/staff/tickets/:id — Operations", () => {
    it("updates ticket owner, itPriority, and status", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          ownerId: staffUserId,
          itPriority: "HIGH",
          status: "In Progress",
        });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe(staffUserId);
      expect(res.body.itPriority).toBe("HIGH");
      expect(res.body.currentStatus).toBe("In Progress");
      expect(res.body.owner).toBeDefined();
      expect(res.body.owner.id).toBe(staffUserId);
    });

    it("allows unassigning owner by setting ownerId to null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ ownerId: null });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBeNull();
    });

    it("rejects invalid owner role (e.g. requester)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ ownerId: requesterUserId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid owner");
    });

    it("rejects invalid itPriority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid itPriority");
    });

    it("rejects invalid status", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Archived" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid status");
    });

    it("returns 403 when called by Requester", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
    });
  });

  describe("Public Comments & Isolation", () => {
    it("allows IT staff to append a public comment", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/public-comments`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ content: "We are currently investigating the issue." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("We are currently investigating the issue.");
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("allows ticket requester to post public comment via /api/tickets/:id/public-comments", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/public-comments`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ content: "Thank you for looking into this." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Thank you for looking into this.");
      expect(res.body.authorId).toBe(requesterUserId);
    });

    it("forbids other requesters from posting comments on this ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/public-comments`)
        .set("Cookie", getRequesterCookie(otherRequesterUserId))
        .send({ content: "Intruder commenting" });

      expect(res.status).toBe(403);
    });

    it("ensures Requester GET /api/tickets/:id sees public comments but NOT internal notes", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}`)
        .set("Cookie", getRequesterCookie(requesterUserId));

      expect(res.status).toBe(200);
      expect(res.body.comments).toBeDefined();
      expect(res.body.comments.length).toBeGreaterThanOrEqual(2);
      expect(res.body.notes).toBeUndefined(); // Notes must never leak to requester
    });
  });

  describe("GET /api/staff/assignees", () => {
    it("returns list of active staff and admin users", async () => {
      const res = await request(app)
        .get("/api/staff/assignees")
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("name");
      expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(res.body[0].role);
    });
  });
});
