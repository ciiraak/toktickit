import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../authMiddleware.js";

const router = Router();

// Apply auth + role guard: only ADMINISTRATOR allowed
router.use(requireAuth, requireRole(["ADMINISTRATOR"]));

const VALID_ROLES = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];

// GET /api/admin/users — list, search, filter, paginate users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const {
      search,
      role,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role && typeof role === "string" && VALID_ROLES.includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    if (isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true" || isActive === true;
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const validSortFields = ["id", "name", "email", "role", "isActive", "createdAt", "requiresPasswordChange"];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
    const order = (sortOrder as string).toLowerCase() === "asc" ? "asc" : "desc";

    const prisma = getPrisma();
    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [sortField]: order },
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          requiresPasswordChange: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.status(200).json({
      users,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users — create user with role and initial password
router.post("/users", async (req: Request, res: Response) => {
  const { name, email, role, initialPassword, password } = req.body;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const pwd = typeof initialPassword === "string" ? initialPassword : typeof password === "string" ? password : "";

  const errors: string[] = [];

  if (!trimmedName) {
    errors.push("Name is required.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    errors.push("A valid email address is required.");
  }

  const upperRole = typeof role === "string" ? role.toUpperCase() : "";
  if (!VALID_ROLES.includes(upperRole)) {
    errors.push(`Role must be one of: ${VALID_ROLES.join(", ")}.`);
  }

  if (!pwd || pwd.length < 6) {
    errors.push("Initial password must be at least 6 characters long.");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  try {
    const prisma = getPrisma();

    // Check unique email (BR-09)
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      res.status(400).json({ error: "Email is already in use.", details: ["Email is already registered."] });
      return;
    }

    const passwordHash = await bcrypt.hash(pwd, 10);

    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        role: upperRole as any,
        passwordHash,
        requiresPasswordChange: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        requiresPasswordChange: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH /api/admin/users/:id — update basic info and activation state
router.patch("/users/:id", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { name, email, role, isActive } = req.body;
  const updates: any = {};
  const errors: string[] = [];

  if (name !== undefined) {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      errors.push("Name cannot be empty.");
    } else {
      updates.name = trimmedName;
    }
  }

  if (email !== undefined) {
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.push("A valid email address is required.");
    } else {
      updates.email = trimmedEmail;
    }
  }

  if (role !== undefined) {
    const upperRole = typeof role === "string" ? role.toUpperCase() : "";
    if (!VALID_ROLES.includes(upperRole)) {
      errors.push(`Role must be one of: ${VALID_ROLES.join(", ")}.`);
    } else {
      updates.role = upperRole;
    }
  }

  if (isActive !== undefined) {
    updates.isActive = Boolean(isActive);
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided to update." });
    return;
  }

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // BR-08 / AC-05: Administrators cannot deactivate themselves
    if (req.user!.id === userId && updates.isActive === false) {
      res.status(400).json({ error: "Administrators cannot deactivate themselves." });
      return;
    }

    // BR-08: Check if deactivating or demoting the last active administrator
    const isDemotingOrDeactivatingAdmin =
      targetUser.role === "ADMINISTRATOR" &&
      targetUser.isActive &&
      (updates.isActive === false || (updates.role && updates.role !== "ADMINISTRATOR"));

    if (isDemotingOrDeactivatingAdmin) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: "ADMINISTRATOR",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        res.status(400).json({
          error: "Cannot deactivate or demote the last active Administrator.",
        });
        return;
      }
    }

    // BR-09: Unique email check if email is being changed
    if (updates.email && updates.email !== targetUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email: updates.email },
      });
      if (duplicateUser) {
        res.status(400).json({ error: "Email is already in use.", details: ["Email is already registered."] });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        requiresPasswordChange: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// POST /api/admin/users/:id/reset-password — set new initial password requiring change
router.post("/users/:id/reset-password", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { initialPassword, newPassword, password } = req.body;
  const pwd =
    typeof initialPassword === "string" && initialPassword.trim()
      ? initialPassword.trim()
      : typeof newPassword === "string" && newPassword.trim()
      ? newPassword.trim()
      : typeof password === "string" && password.trim()
      ? password.trim()
      : "Password123!";

  if (pwd.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long." });
    return;
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordHash = await bcrypt.hash(pwd, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        requiresPasswordChange: true,
      },
    });

    res.status(200).json({
      message: "Password reset successfully. User will be prompted to change password on next login.",
      id: user.id,
      requiresPasswordChange: true,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
