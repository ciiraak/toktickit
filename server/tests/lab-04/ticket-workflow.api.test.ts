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

describe("Lab 4 - Ticket Workflow & Status Transition API (Feature 19)", () => {
  let staffUserId: number;
  let requesterUserId: number;
  let inactiveUserId: number;
  let testTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const staff = await prisma.user.findFirst({ where: { role: "IT_STAFF", isActive: true } });
    const requester = await prisma.user.findFirst({ where: { role: "REQUESTER", isActive: true } });
    const inactiveUser = await prisma.user.findFirst({ where: { isActive: false } });

    if (!staff || !requester || !inactiveUser) throw new Error("Seed users missing");

    staffUserId = staff.id;
    requesterUserId = requester.id;
    inactiveUserId = inactiveUser.id;

    // Create a fresh test ticket starting in "New" status
    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    const created = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-FLOW-${Date.now().toString().slice(-6)}`,
        requesterId: requesterUserId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Workflow transition test ticket",
        description: "Testing valid and invalid status transitions across the state machine.",
        requestedPriority: "MEDIUM",
        currentStatus: "New",
      },
    });

    testTicketId = created.id;
  });

  describe("API-06: Permitted Status Transitions (BR-06)", () => {
    it("advances from New -> Open", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Open" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Open");
    });

    it("advances from Open -> In Progress", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("In Progress");
    });

    it("advances from In Progress -> Resolved", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Resolved");
    });

    it("advances from Resolved -> Closed", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Closed" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Closed");
    });

    it("reopens from Closed -> Reopened", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Reopened" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Reopened");
    });

    it("re-resolves from Reopened -> Resolved", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Resolved");
    });
  });

  describe("API-07: Disallowed Status Transitions (BR-06)", () => {
    it("rejects illegal transition directly from New -> Closed with HTTP 400", async () => {
      const prisma = getPrisma();
      const freshTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-NEW-${Date.now().toString().slice(-6)}`,
          requesterId: requesterUserId,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Illegal transition test",
          description: "Testing direct jump from New to Closed.",
          requestedPriority: "LOW",
          currentStatus: "New",
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${freshTicket.id}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Closed" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/invalid status transition/i);
    });

    it("rejects transition from Cancelled (terminal state) to Open with HTTP 400", async () => {
      const prisma = getPrisma();
      const cancelledTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-CNC-${Date.now().toString().slice(-6)}`,
          requesterId: requesterUserId,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Cancelled ticket test",
          description: "Cancelled ticket cannot transition to any other status.",
          requestedPriority: "LOW",
          currentStatus: "Cancelled",
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${cancelledTicket.id}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "Open" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/invalid status transition/i);
    });

    it("rejects transition from Closed directly to In Progress without reopening first", async () => {
      const prisma = getPrisma();
      const closedTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-CLO-${Date.now().toString().slice(-6)}`,
          requesterId: requesterUserId,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Closed ticket test",
          description: "Closed ticket can only transition to Reopened.",
          requestedPriority: "LOW",
          currentStatus: "Closed",
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${closedTicket.id}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ status: "In Progress" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid status transition/i);
    });
  });

  describe("API-08: Advisory Resolution Gate (BR-05 / BR-07)", () => {
    it("posts public comment when requester signals problem resolved without changing currentStatus", async () => {
      const prisma = getPrisma();
      const inProgressTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ADV-${Date.now().toString().slice(-6)}`,
          requesterId: requesterUserId,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Advisory resolution test",
          description: "Testing advisory comment behavior on ticket status.",
          requestedPriority: "MEDIUM",
          currentStatus: "In Progress",
        },
      });

      // Requester posts "problem appears resolved" comment
      const commentRes = await request(app)
        .post(`/api/tickets/${inProgressTicket.id}/public-comments`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ content: "Requester indicated that the problem appears resolved." });

      expect(commentRes.status).toBe(201);

      // Verify that authoritative ticket status is STILL "In Progress"
      const refreshed = await prisma.ticket.findUnique({ where: { id: inProgressTicket.id } });
      expect(refreshed?.currentStatus).toBe("In Progress");
    });

    it("rejects requester attempt to directly update ticket status with HTTP 403", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
    });
  });

  describe("API-09: Stale Concurrency Protection (BR-08)", () => {
    it("returns HTTP 409 Conflict when clientUpdatedAt does not match server state", async () => {
      const staleTimestamp = new Date("2020-01-01T00:00:00.000Z").toISOString();

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          status: "Closed",
          clientUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/conflict/i);
      expect(res.body).toHaveProperty("currentStatus");
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("succeeds when clientUpdatedAt matches current ticket state", async () => {
      const prisma = getPrisma();
      const current = await prisma.ticket.findUnique({ where: { id: testTicketId } });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          status: "Closed",
          clientUpdatedAt: current!.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Closed");
    });
  });

  describe("Assignee Validation (BR-06 / BR-11)", () => {
    it("rejects inactive user as assignee with HTTP 400", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ ownerId: inactiveUserId });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/active IT Staff or Administrator/i);
    });

    it("rejects user with role REQUESTER as ticket owner with HTTP 400", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ ownerId: requesterUserId });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/active IT Staff or Administrator/i);
    });
  });
});
