import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_prod";

function getAuthCookie(userId: number, role: string) {
  const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

describe("Lab 3 - Administrator User Management API (API-05 & FR-07)", () => {
  let adminId: number;
  let adminCookie: string;
  let staffId: number;
  let staffCookie: string;
  let requesterId: number;
  let requesterCookie: string;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Ensure we have an admin, staff, and requester
    let admin = await prisma.user.findFirst({ where: { role: "ADMINISTRATOR", isActive: true } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: "Test Admin",
          email: "test.admin@kmutt.ac.th",
          passwordHash: await bcrypt.hash("Password123!", 10),
          role: "ADMINISTRATOR",
          requiresPasswordChange: false,
          isActive: true,
        },
      });
    }
    adminId = admin.id;
    adminCookie = getAuthCookie(adminId, "ADMINISTRATOR");

    let staff = await prisma.user.findFirst({ where: { role: "IT_STAFF", isActive: true } });
    if (!staff) {
      staff = await prisma.user.create({
        data: {
          name: "Test Staff",
          email: "test.staff@kmutt.ac.th",
          passwordHash: await bcrypt.hash("Password123!", 10),
          role: "IT_STAFF",
          requiresPasswordChange: false,
          isActive: true,
        },
      });
    }
    staffId = staff.id;
    staffCookie = getAuthCookie(staffId, "IT_STAFF");

    let requester = await prisma.user.findFirst({ where: { role: "REQUESTER", isActive: true } });
    if (!requester) {
      requester = await prisma.user.create({
        data: {
          name: "Test Requester",
          email: "test.requester@kmutt.ac.th",
          passwordHash: await bcrypt.hash("Password123!", 10),
          role: "REQUESTER",
          requiresPasswordChange: false,
          isActive: true,
        },
      });
    }
    requesterId = requester.id;
    requesterCookie = getAuthCookie(requesterId, "REQUESTER");
  });

  describe("Access Control & Authorization", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 when accessed by REQUESTER", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("returns 403 when accessed by IT_STAFF", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(403);
    });

    it("returns 200 when accessed by ADMINISTRATOR", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/admin/users", () => {
    it("returns a paginated list of users without passwordHash", async () => {
      const res = await request(app)
        .get("/api/admin/users?page=1&limit=5")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);

      const first = res.body.users[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("email");
      expect(first).toHaveProperty("role");
      expect(first).toHaveProperty("isActive");
      expect(first).not.toHaveProperty("passwordHash");
    });

    it("filters users by role and search term", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=REQUESTER")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      for (const u of res.body.users) {
        expect(u.role).toBe("REQUESTER");
      }
    });

    it("filters users by active status", async () => {
      const res = await request(app)
        .get("/api/admin/users?isActive=true")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      for (const u of res.body.users) {
        expect(u.isActive).toBe(true);
      }
    });
  });

  describe("POST /api/admin/users (Create User)", () => {
    const timestamp = Date.now();
    const testEmail = `newuser.${timestamp}@kmutt.ac.th`;

    it("creates a new user with requiresPasswordChange=true and hashed password", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Alice Wonderland",
          email: testEmail,
          role: "REQUESTER",
          initialPassword: "InitialSecret123!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Alice Wonderland");
      expect(res.body.email).toBe(testEmail);
      expect(res.body.role).toBe("REQUESTER");
      expect(res.body.requiresPasswordChange).toBe(true);
      expect(res.body.isActive).toBe(true);
      expect(res.body).not.toHaveProperty("passwordHash");

      // Verify in DB that password is appropriately hashed
      const prisma = getPrisma();
      const dbUser = await prisma.user.findUnique({ where: { id: res.body.id } });
      expect(dbUser).toBeDefined();
      const matches = await bcrypt.compare("InitialSecret123!", dbUser!.passwordHash);
      expect(matches).toBe(true);
    });

    it("rejects duplicate email address (BR-09)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Duplicate Person",
          email: testEmail,
          role: "IT_STAFF",
          initialPassword: "Password123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it("validates required fields and email format", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "",
          email: "invalid-email-format",
          role: "SUPERUSER",
          initialPassword: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("details");
      expect(res.body.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("PATCH /api/admin/users/:id (Update User)", () => {
    let createdUserId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const user = await prisma.user.create({
        data: {
          name: "Update Target",
          email: `update.target.${Date.now()}@kmutt.ac.th`,
          passwordHash: await bcrypt.hash("Password123!", 10),
          role: "REQUESTER",
          requiresPasswordChange: true,
          isActive: true,
        },
      });
      createdUserId = user.id;
    });

    it("updates basic info: name, email, and role", async () => {
      const newEmail = `updated.email.${Date.now()}@kmutt.ac.th`;
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Updated Name",
          email: newEmail,
          role: "IT_STAFF",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.email).toBe(newEmail);
      expect(res.body.role).toBe("IT_STAFF");
    });

    it("deactivates and reactivates a regular user", async () => {
      const res1 = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res1.status).toBe(200);
      expect(res1.body.isActive).toBe(false);

      const res2 = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Cookie", adminCookie)
        .send({ isActive: true });

      expect(res2.status).toBe(200);
      expect(res2.body.isActive).toBe(true);
    });

    it("API-05 / BR-08: rejects admin self-deactivation", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminId}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot deactivate themselves/i);
    });

    it("BR-08: prevents deactivating or demoting the last active admin", async () => {
      const prisma = getPrisma();
      
      // Temporarily deactivate any extra admins so only adminId remains active
      const otherAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", id: { not: adminId }, isActive: true },
      });
      if (otherAdmins.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherAdmins.map((a) => a.id) } },
          data: { isActive: false },
        });
      }

      // Try to demote the only active admin to IT_STAFF
      const res = await request(app)
        .patch(`/api/admin/users/${adminId}`)
        .set("Cookie", adminCookie)
        .send({ role: "IT_STAFF" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/last active administrator/i);

      // Restore other admins if any
      if (otherAdmins.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: otherAdmins.map((a) => a.id) } },
          data: { isActive: true },
        });
      }
    });
  });

  describe("POST /api/admin/users/:id/reset-password", () => {
    let resetUserId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const user = await prisma.user.create({
        data: {
          name: "Reset Target",
          email: `reset.target.${Date.now()}@kmutt.ac.th`,
          passwordHash: await bcrypt.hash("OldPassword123!", 10),
          role: "REQUESTER",
          requiresPasswordChange: false,
          isActive: true,
        },
      });
      resetUserId = user.id;
    });

    it("resets the password and flags requiresPasswordChange=true", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${resetUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: "NewTempPassword456!" });

      expect(res.status).toBe(200);
      expect(res.body.requiresPasswordChange).toBe(true);

      // Verify in DB
      const prisma = getPrisma();
      const updated = await prisma.user.findUnique({ where: { id: resetUserId } });
      expect(updated?.requiresPasswordChange).toBe(true);
      const matches = await bcrypt.compare("NewTempPassword456!", updated!.passwordHash);
      expect(matches).toBe(true);
    });

    it("returns 404 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/admin/users/999999/reset-password")
        .set("Cookie", adminCookie)
        .send({ initialPassword: "Password123!" });

      expect(res.status).toBe(404);
    });
  });
});
