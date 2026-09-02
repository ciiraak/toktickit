import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Seeded requester IDs (from prisma/seed.ts):
//   1 = Jennifer Anderson (active)
//   5 = John Doe (inactive)

describe("Lab 2 - POST /api/tickets", () => {
  // API-02: Field validation must return 400 for short summary/description
  it("returns 401 when x-requester-id header is missing", async () => {
    const res = await request(app).post("/api/tickets").field("summary", "Too short");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when requester is inactive (BR-04, BR-11)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "5") // John Doe — inactive
      .field("summary", "Some valid summary text here")
      .field("description", "Some valid long description text here that is at least 20 chars")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  // API-02: Field validation — summary too short (< 10 chars)
  it("returns 400 when summary is shorter than 10 characters (BR-05)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1") // Jennifer Anderson — active
      .field("summary", "Short")
      .field("description", "Some valid long description text here that is at least 20 chars")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  // API-02: Field validation — description too short (< 20 chars)
  it("returns 400 when description is shorter than 20 characters (BR-05)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1") // Jennifer Anderson — active
      .field("summary", "Valid summary text here for testing")
      .field("description", "Too short")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
  });

  // API-02: File validation — wrong MIME type rejected
  it("returns 400 when attachment has invalid file type (BR-06)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .field("summary", "Valid summary text here for testing")
      .field("description", "A long enough description for the ticket creation")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM")
      .attach("attachments", Buffer.from("fake exe content"), {
        filename: "malware.exe",
        contentType: "application/octet-stream",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // API-01: Happy path — create a valid ticket with no attachments → 201
  it("returns 201 and ticket number when all fields are valid (AC-01, BR-01, BR-02)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1") // Jennifer Anderson — active
      .field("summary", "My laptop screen flickers intermittently")
      .field("description", "The screen flickers randomly when the laptop is plugged in. This happens about 3–4 times per hour.")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body).toHaveProperty("currentStatus", "New");
    expect(res.body).toHaveProperty("id");
  });
});
