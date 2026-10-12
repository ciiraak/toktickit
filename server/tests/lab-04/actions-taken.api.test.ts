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

describe("Lab 4 - Actions Taken API (Foundation)", () => {
  let staffUserId: number;
  let requesterUserId: number;
  let otherRequesterUserId: number;
  let testTicketId: number;
  let otherTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const staff = await prisma.user.findFirst({ where: { role: "IT_STAFF", isActive: true } });
    const requester = await prisma.user.findFirst({ where: { role: "REQUESTER", email: "jennifer.anderson@kmutt.ac.th" } });
    const otherRequester = await prisma.user.findFirst({ where: { role: "REQUESTER", email: "michael.brown@kmutt.ac.th" } });

    if (!staff || !requester || !otherRequester) throw new Error("Seed users missing");

    staffUserId = staff.id;
    requesterUserId = requester.id;
    otherRequesterUserId = otherRequester.id;

    const ticket1 = await prisma.ticket.findFirst({ where: { requesterId: requesterUserId } });
    const ticket2 = await prisma.ticket.findFirst({ where: { requesterId: otherRequesterUserId } });

    if (!ticket1 || !ticket2) throw new Error("Seed tickets missing");

    testTicketId = ticket1.id;
    otherTicketId = ticket2.id;
  });

  describe("POST /api/staff/tickets/:id/actions-taken (Create Action Taken)", () => {
    it("AC-01 / API-01: saves Action Taken with authenticated staff actor as performedById", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          description: "Inspected network cable and replaced RJ-45 connector",
          result: "Ping latency restored to normal (1ms)",
          followUpRequired: false,
          attachmentNotes: "photo_connector.jpg",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.ticketId).toBe(testTicketId);
      expect(res.body.description).toBe("Inspected network cable and replaced RJ-45 connector");
      expect(res.body.result).toBe("Ping latency restored to normal (1ms)");
      expect(res.body.performedById).toBe(staffUserId);
      expect(res.body.performedBy).toHaveProperty("name");
      expect(res.body.performedBy.role).toBe("IT_STAFF");
      expect(res.body.followUpRequired).toBe(false);
      expect(res.body.attachmentNotes).toBe("photo_connector.jpg");
    });

    it("AC-02 / API-02: rejects request with HTTP 400 when followUpRequired is true but followUpNote is empty", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          description: "Applied temporary patch",
          result: "System running on fallback power",
          followUpRequired: true,
          followUpNote: "   ", // whitespace only
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("creates Action Taken successfully when followUpRequired is true and followUpNote is provided", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          description: "Applied hotfix kernel patch",
          result: "Server stable for now",
          followUpRequired: true,
          followUpNote: "Conduct full regression test over weekend",
        });

      expect(res.status).toBe(201);
      expect(res.body.followUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("Conduct full regression test over weekend");
    });

    it("rejects request with HTTP 400 when description or result is missing", async () => {
      const res1 = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ result: "Done" });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ description: "Fixed it" });
      expect(res2.status).toBe(400);
    });

    it("AC-03 / API-03: returns HTTP 403 Forbidden when called by a Requester", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({
          description: "Requester trying to record action",
          result: "Attempt",
        });

      expect(res.status).toBe(403);
    });

    it("returns HTTP 401 when unauthenticated", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
        .send({
          description: "Anonymous action",
          result: "Attempt",
        });

      expect(res.status).toBe(401);
    });

    it("returns HTTP 404 when ticket does not exist", async () => {
      const res = await request(app)
        .post("/api/staff/tickets/999999/actions-taken")
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          description: "Valid action",
          result: "Valid result",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/staff/tickets/:id/actions-taken/:actionId (Update Action Taken)", () => {
    let createdActionId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          description: "Initial diagnostic check",
          result: "Pending deeper inspection",
          performedById: staffUserId,
          followUpRequired: false,
        },
      });
      createdActionId = action.id;
    });

    it("API-05: updates description and result successfully by Staff member", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          result: "Inspection complete - replaced bad RAM stick",
          followUpRequired: true,
          followUpNote: "Run memtest86 overnight",
        });

      expect(res.status).toBe(200);
      expect(res.body.result).toBe("Inspection complete - replaced bad RAM stick");
      expect(res.body.followUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe("Run memtest86 overnight");
    });

    it("rejects update with HTTP 400 when setting followUpRequired to true without a note", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({
          followUpRequired: true,
          followUpNote: "",
        });

      expect(res.status).toBe(400);
    });

    it("returns HTTP 403 when called by a Requester", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Cookie", getRequesterCookie(requesterUserId))
        .send({ result: "Requester edit attempt" });

      expect(res.status).toBe(403);
    });

    it("returns HTTP 404 when action ID does not exist", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/actions-taken/999999`)
        .set("Cookie", getStaffCookie(staffUserId))
        .send({ result: "Update non-existent" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/tickets/:id/actions-taken (Read Actions Taken)", () => {
    it("AC-04 / API-04: allows Requester to read Actions Taken for tickets they own", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Cookie", getRequesterCookie(requesterUserId));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("performedBy");
    });

    it("AC-04 / API-04: returns HTTP 403 when Requester attempts to view Actions Taken of another user's ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${otherTicketId}/actions-taken`)
        .set("Cookie", getRequesterCookie(requesterUserId));

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });

    it("allows IT Staff to read Actions Taken for any ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${otherTicketId}/actions-taken`)
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns HTTP 401 when unauthenticated", async () => {
      const res = await request(app).get(`/api/tickets/${testTicketId}/actions-taken`);
      expect(res.status).toBe(401);
    });

    it("returns HTTP 404 when ticket does not exist", async () => {
      const res = await request(app)
        .get("/api/tickets/999999/actions-taken")
        .set("Cookie", getStaffCookie(staffUserId));

      expect(res.status).toBe(404);
    });
  });
});
