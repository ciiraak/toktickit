import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 - Auth API", () => {
  let activeRequesterEmail = "jennifer.anderson@kmutt.ac.th";
  let password = "Password123!";

  beforeAll(async () => {
    // Ensure the test user exists
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: activeRequesterEmail } });
    if (!user) {
      await prisma.user.create({
        data: {
          name: "Test User",
          email: activeRequesterEmail,
          passwordHash: await bcrypt.hash(password, 10),
          role: "REQUESTER",
          requiresPasswordChange: true,
          isActive: true
        }
      });
    }
  });

  describe("API-01 & API-02: POST /api/auth/login", () => {
    it("returns 200 and safe user data for valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", activeRequesterEmail);
      expect(res.body).toHaveProperty("role", "REQUESTER");
      expect(res.body).not.toHaveProperty("passwordHash");
      expect(res.body).toHaveProperty("requiresPasswordChange");
      
      // Cookie should be set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=.+;/);
    });

    it("returns 401 for invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password: "WrongPassword!" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid email or password");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the token cookie", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(200);
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=;/);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user profile when authenticated", async () => {
      // First login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeRequesterEmail, password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email", activeRequesterEmail);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("changes password successfully and sets requiresPasswordChange to false", async () => {
      // Create a dedicated user for this test to avoid messing up other tests
      const prisma = getPrisma();
      const testEmail = "change.test@kmutt.ac.th";
      await prisma.user.upsert({
        where: { email: testEmail },
        update: { requiresPasswordChange: true, passwordHash: await bcrypt.hash("OldPassword123!", 10) },
        create: {
          name: "Change Test",
          email: testEmail,
          passwordHash: await bcrypt.hash("OldPassword123!", 10),
          role: "REQUESTER",
          requiresPasswordChange: true,
          isActive: true
        }
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "OldPassword123!" });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: "OldPassword123!", newPassword: "NewPassword123!" });

      expect(res.status).toBe(200);
      
      // Verify in DB
      const updatedUser = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(updatedUser?.requiresPasswordChange).toBe(false);
      
      const isValid = await bcrypt.compare("NewPassword123!", updatedUser!.passwordHash);
      expect(isValid).toBe(true);
    });
  });
});
