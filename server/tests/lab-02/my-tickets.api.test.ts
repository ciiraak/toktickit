import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 - GET /api/tickets", () => {
  it("returns 401 when x-requester-id header is missing", async () => {
    const res = await request(app).get("/api/tickets");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 403 when requester is inactive", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", "5"); // Inactive requester ID

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});
