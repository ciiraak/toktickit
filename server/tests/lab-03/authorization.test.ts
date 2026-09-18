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

describe("Lab 3 - Requester Ownership & Authorization API (API-03)", () => {
  let ownerRequesterId: number;
  let otherRequesterId: number;
  let ownerTicketId: number;
  let ownerAttachmentId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const requesters = await prisma.user.findMany({
      where: { role: "REQUESTER", isActive: true },
      take: 2,
    });
    if (requesters.length < 2) {
      throw new Error("Need at least two active requesters in seed");
    }

    ownerRequesterId = requesters[0].id;
    otherRequesterId = requesters[1].id;

    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    // Create a ticket owned by ownerRequester
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-AUTH-${Date.now().toString().slice(-6)}`,
        requesterId: ownerRequesterId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
        summary: "Authorization Ownership Test Ticket",
        description: "Checking that other requesters cannot read or tamper with this ticket.",
        requestedPriority: "MEDIUM",
        currentStatus: "New",
        attachments: {
          create: {
            filename: "secret-doc.pdf",
            filePath: "server/uploads/fake-secret.pdf",
            mimeType: "application/pdf",
            fileSize: 1024,
          },
        },
      },
      include: { attachments: true },
    });

    ownerTicketId = ticket.id;
    ownerAttachmentId = ticket.attachments[0].id;
  });

  it("API-03: returns 403 when a requester tries to view another requester's ticket", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ownerTicketId}`)
      .set("Cookie", getRequesterCookie(otherRequesterId));

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied|another requester/i);
  });

  it("returns 403 when a requester tries to upload an attachment to another's ticket", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ownerTicketId}/attachments`)
      .set("Cookie", getRequesterCookie(otherRequesterId))
      .attach("attachment", Buffer.from("fake data"), "test.png");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied|another requester/i);
  });

  it("returns 403 when a requester tries to download an attachment from another's ticket", async () => {
    const res = await request(app)
      .get(`/api/attachments/${ownerAttachmentId}`)
      .set("Cookie", getRequesterCookie(otherRequesterId));

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied|another requester/i);
  });

  it("returns 403 when a requester tries to delete an attachment from another's ticket", async () => {
    const res = await request(app)
      .delete(`/api/attachments/${ownerAttachmentId}`)
      .set("Cookie", getRequesterCookie(otherRequesterId))
      .send({ deletionReason: "Malicious deletion attempt" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied|another requester/i);
  });

  it("returns 403 when a requester tries to post a comment to another's ticket", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ownerTicketId}/public-comments`)
      .set("Cookie", getRequesterCookie(otherRequesterId))
      .send({ content: "Intruder attempting to comment" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied|another requester/i);
  });

  it("returns 401 for unauthenticated requests to ticket detail", async () => {
    const res = await request(app).get(`/api/tickets/${ownerTicketId}`);
    expect(res.status).toBe(401);
  });

  it("allows the owner requester to view their own ticket with 200", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ownerTicketId}`)
      .set("Cookie", getRequesterCookie(ownerRequesterId));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ownerTicketId);
    expect(res.body.requesterId).toBe(ownerRequesterId);
  });
});
