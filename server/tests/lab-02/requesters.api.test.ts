import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 - Requester & System Lookup APIs", () => {
  describe("GET /api/requesters", () => {
    it("returns 200 and only active development requesters", async () => {
      const response = await request(app).get("/api/requesters");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4);

      // Verify active requesters are present
      const names = response.body.map((r: { name: string }) => r.name);
      expect(names).toContain("Jennifer Anderson");
      expect(names).toContain("Michael Brown");
      expect(names).toContain("Sarah Johnson");
      expect(names).toContain("David Lee");

      // Verify inactive requester is NOT included
      expect(names).not.toContain("John Doe");

      // Check structure
      const first = response.body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("email");
    });
  });

  describe("GET /api/systems", () => {
    it("returns 200 and all 7 active related systems", async () => {
      const response = await request(app).get("/api/systems");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(7);

      const systemNames = response.body.map((s: { name: string }) => s.name);
      expect(systemNames).toContain("Email");
      expect(systemNames).toContain("Campus Wi-Fi");
      expect(systemNames).toContain("VPN");
      expect(systemNames).toContain("LEB2 App");
      expect(systemNames).toContain("Grade Submission App");
      expect(systemNames).toContain("Printer");
      expect(systemNames).toContain("Corporate Laptop");
    });
  });
});
