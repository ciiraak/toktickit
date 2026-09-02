import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Helper: builds a valid ticket form payload
const validPayload = {
  summary: "My laptop battery drains too fast",
  description: "The battery drains from 100% to 0% within 2 hours of light usage.",
  categoryId: "2",
  relatedSystemId: "7",
  requestedPriority: "MEDIUM",
};

// Active requester id (Jennifer Anderson, seeded in lab-02)
const ACTIVE_REQUESTER_ID = "1";
// Inactive requester id (John Doe, seeded as inactive)
const INACTIVE_REQUESTER_ID = "5";

describe("Lab 2 - POST /api/tickets", () => {
  it("returns 401 when x-requester-id header is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("summary", validPayload.summary)
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when requester is inactive", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", INACTIVE_REQUESTER_ID)
      .field("summary", validPayload.summary)
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when summary is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", ACTIVE_REQUESTER_ID)
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("details");
  });

  it("returns 400 when summary is too short (< 10 chars)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", ACTIVE_REQUESTER_ID)
      .field("summary", "Too short")
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(400);
    expect(res.body.details.some((d: string) => d.includes("10 characters"))).toBe(true);
  });

  it("returns 400 when description is too short (< 20 chars)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", ACTIVE_REQUESTER_ID)
      .field("summary", validPayload.summary)
      .field("description", "Too short desc.")
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(400);
    expect(res.body.details.some((d: string) => d.includes("20 characters"))).toBe(true);
  });

  it("returns 400 when priority is invalid", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", ACTIVE_REQUESTER_ID)
      .field("summary", validPayload.summary)
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", "URGENT");

    expect(res.status).toBe(400);
    expect(res.body.details.some((d: string) => d.includes("Priority"))).toBe(true);
  });

  it("returns 201 with a valid ticket and TKT-prefixed ticket number", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", ACTIVE_REQUESTER_ID)
      .field("summary", validPayload.summary)
      .field("description", validPayload.description)
      .field("categoryId", validPayload.categoryId)
      .field("relatedSystemId", validPayload.relatedSystemId)
      .field("requestedPriority", validPayload.requestedPriority);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.currentStatus).toBe("New");
    expect(res.body.requestedPriority).toBe("MEDIUM");
    expect(res.body.requesterId).toBe(1);
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });
});
