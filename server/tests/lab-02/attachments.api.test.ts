import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// Seeded requester IDs (from prisma/seed.ts):
//   1 = Jennifer Anderson (active)
//   2 = Michael Brown (active)
//   5 = John Doe (inactive)

describe("Lab 2 - Attachments API", () => {
  // ─── Header Auth tests (no DB required) ───────────────────────────

  describe("POST /api/tickets/:id/attachments", () => {
    it("returns 401 when x-requester-id header is missing", async () => {
      const res = await request(app).post("/api/tickets/1/attachments");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/attachments/:id", () => {
    it("returns 401 when x-requester-id header is missing", async () => {
      const res = await request(app).get("/api/attachments/1");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/attachments/:id", () => {
    it("returns 401 when x-requester-id header is missing", async () => {
      const res = await request(app)
        .delete("/api/attachments/1")
        .send({ deletionReason: "Uploaded wrong file" });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 when deletionReason is too short (< 5 chars) (BR-09)", async () => {
      const res = await request(app)
        .delete("/api/attachments/1")
        .set("x-requester-id", "1")
        .send({ deletionReason: "Hi" }); // Only 2 chars

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body).toHaveProperty("details");
    });
  });

  // ─── DB-connected integration tests ───────────────────────────────

  describe("API-05 — Attachment count limit (BR-08)", () => {
    let ticketId: number;
    const prisma = getPrisma();

    beforeAll(async () => {
      // Create a fresh ticket owned by Jennifer Anderson (requester id=1)
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-TEST-AT${Date.now()}`.substring(0, 20),
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Attachment limit test ticket",
          description: "This ticket is used to test the attachment limit business rule BR-08.",
          requestedPriority: "LOW",
          currentStatus: "New",
          attachments: {
            create: Array.from({ length: 5 }).map((_, i) => ({
              filename: `file${i + 1}.pdf`,
              filePath: `/tmp/file${i + 1}.pdf`,
              mimeType: "application/pdf",
              fileSize: 1024 * (i + 1),
            })),
          },
        },
      });
      ticketId = ticket.id;
    });

    afterAll(async () => {
      // Clean up test ticket and its attachments
      await prisma.attachment.deleteMany({ where: { ticketId } });
      await prisma.ticket.delete({ where: { id: ticketId } });
    });

    it("returns 400 when trying to add a 6th active attachment (BR-08)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("x-requester-id", "1")
        .attach("attachment", Buffer.from("%PDF-1.4 fake content"), {
          filename: "seventh-file.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/maximum 5/i);
    });
  });

  describe("API-06 — Soft removal with reason + download blocked (BR-09, BR-10)", () => {
    let ticketId: number;
    let attachmentId: number;
    const prisma = getPrisma();

    beforeAll(async () => {
      // Create a fresh ticket with one attachment
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-TEST-SR${Date.now()}`.substring(0, 20),
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Soft removal test ticket",
          description: "This ticket is used to test the soft removal business rule BR-09 and BR-10.",
          requestedPriority: "LOW",
          currentStatus: "New",
          attachments: {
            create: [
              {
                filename: "evidence.pdf",
                filePath: "/tmp/evidence.pdf",
                mimeType: "application/pdf",
                fileSize: 4096,
              },
            ],
          },
        },
        include: { attachments: true },
      });
      ticketId = ticket.id;
      attachmentId = ticket.attachments[0].id;
    });

    afterAll(async () => {
      await prisma.attachment.deleteMany({ where: { ticketId } });
      await prisma.ticket.delete({ where: { id: ticketId } });
    });

    it("returns 200 and sets deletedAt when soft-removing with a valid reason (BR-09)", async () => {
      const res = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("x-requester-id", "1")
        .send({ deletionReason: "No longer relevant to this ticket" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("deletedAt");
      expect(res.body.deletedAt).not.toBeNull();
      expect(res.body).toHaveProperty("deletionReason", "No longer relevant to this ticket");
    });

    it("returns 410 Gone when downloading a soft-removed attachment (BR-10)", async () => {
      const res = await request(app)
        .get(`/api/attachments/${attachmentId}`)
        .set("x-requester-id", "1");

      expect(res.status).toBe(410);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/removed/i);
      expect(res.body).toHaveProperty("reason");
    });

    it("returns 409 Conflict when trying to soft-remove an already-removed attachment", async () => {
      const res = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set("x-requester-id", "1")
        .send({ deletionReason: "Trying to remove again should fail" });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error");
    });
  });
});
