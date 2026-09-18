import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber, validateAttachmentFile, validateTicketFields } from "./ticketHelpers.js";
import authRoutes from "./routes/auth.js";
import staffRoutes from "./routes/staff.js";
import adminRoutes from "./routes/admin.js";
import { requireAuth, requireRole } from "./authMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer — store to server/uploads/, 5 MB per file hard limit
const upload = multer({
  dest: path.join(__dirname, "../../uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors({ origin: true, credentials: true })); // Updated for cookies
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use("/api/auth", authRoutes);

// Staff routes
app.use("/api/staff", staffRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// Make the test in tests/lab-01/health.test.ts pass.
// It must return HTTP 200 with JSON: { status: "ok", service: "TokTickIT API" }
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().user.findMany({
      where: { isActive: true, role: "REQUESTER" },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requesters" });
  }
});

app.get("/api/systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch systems" });
  }
});

app.post("/api/tickets", requireAuth, requireRole(["REQUESTER", "IT_STAFF", "ADMINISTRATOR"]), upload.array("attachments", 5), async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();

  // Validate ticket fields (BR-05)
  const fieldErrors = validateTicketFields(req.body);
  if (fieldErrors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: fieldErrors });
    return;
  }

  // Validate uploaded files (BR-06, BR-07)
  const files = (req.files as Express.Multer.File[]) ?? [];
  const fileErrors: string[] = [];
  for (const file of files) {
    const err = validateAttachmentFile(file);
    if (err) fileErrors.push(err);
  }
  if (fileErrors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: fileErrors });
    return;
  }

  try {
    const ticketNumber = await generateTicketNumber(prisma);
    const summary = (req.body.summary as string).trim();
    const description = (req.body.description as string).trim();
    const categoryId = parseInt(req.body.categoryId as string);
    const relatedSystemId = parseInt(req.body.relatedSystemId as string);
    const requestedPriority = (req.body.requestedPriority as string).toUpperCase();

    // Atomic creation: ticket + attachments in one transaction (BR-14)
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          requesterId,
          categoryId,
          relatedSystemId,
          summary,
          description,
          requestedPriority,
          currentStatus: "New",
          attachments: {
            create: files.map((file) => ({
              filename: file.originalname,
              filePath: file.path,
              mimeType: file.mimetype,
              fileSize: file.size,
            })),
          },
        },
        include: {
          attachments: {
            select: { id: true, filename: true, fileSize: true, mimeType: true, createdAt: true },
          },
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      });
      return newTicket;
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Failed to create ticket error:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

app.get("/api/tickets", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();

  try {
    const {
      search,
      category,
      priority,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const where: any = { requesterId };

    if (category) {
      const catId = parseInt(category as string);
      if (!isNaN(catId)) where.categoryId = catId;
    }

    if (priority && typeof priority === "string") {
      where.requestedPriority = priority.toUpperCase();
    }

    if (status && typeof status === "string") {
      where.currentStatus = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
      ];
    }

    // Build sort order
    const validSortFields = ["createdAt", "ticketNumber", "updatedAt"];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
    const order = (sortOrder as string).toLowerCase() === "asc" ? "asc" : "desc";
    const orderBy = { [sortField]: order };

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          requestedPriority: true,
          currentStatus: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { name: true } },
          relatedSystem: { select: { name: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.status(200).json({
      tickets,
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
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

app.get("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();

  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
            deletedAt: true,
            deletionReason: true,
          },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Access denied: ticket belongs to another requester" });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket detail" });
  }
});

app.post("/api/tickets/:id/public-comments", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content) {
    res.status(400).json({ error: "Comment content is required and cannot be empty." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Requesters may only comment on their own tickets
    if (req.user!.role === "REQUESTER" && ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Access denied: ticket belongs to another requester" });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

app.post("/api/tickets/:id/attachments", requireAuth, upload.single("attachment"), async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();

  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Access denied: ticket belongs to another requester" });
      return;
    }

    const activeCount = await prisma.attachment.count({
      where: { ticketId, deletedAt: null },
    });
    if (activeCount >= 5) {
      res.status(400).json({ error: "Ticket already has maximum 5 active attachments." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No attachment file provided." });
      return;
    }

    const fileError = validateAttachmentFile(file);
    if (fileError) {
      res.status(400).json({ error: "Validation failed", details: [fileError] });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        filename: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
      select: {
        id: true,
        filename: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

app.get("/api/attachments/:id", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();
  const attachmentId = parseInt(req.params.id);
  if (isNaN(attachmentId)) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Access denied: ticket belongs to another requester" });
      return;
    }

    if (attachment.deletedAt) {
      res.status(410).json({
        error: "Attachment has been removed",
        deletedAt: attachment.deletedAt,
        reason: attachment.deletionReason,
      });
      return;
    }

    const absolutePath = path.resolve(attachment.filePath);
    res.download(absolutePath, attachment.filename);
  } catch (error) {
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

app.delete("/api/attachments/:id", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const prisma = getPrisma();
  const attachmentId = parseInt(req.params.id);
  if (isNaN(attachmentId)) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }

  const deletionReason = typeof req.body.deletionReason === "string" ? req.body.deletionReason.trim() : "";
  if (!deletionReason || deletionReason.length < 5 || deletionReason.length > 200) {
    res.status(400).json({
      error: "Validation failed",
      details: ["Deletion reason is required and must be between 5 and 200 characters long."],
    });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Access denied: ticket belongs to another requester" });
      return;
    }

    if (attachment.deletedAt) {
      res.status(409).json({ error: "Attachment is already removed" });
      return;
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        deletedAt: new Date(),
        deletionReason,
      },
      select: {
        id: true,
        deletedAt: true,
        deletionReason: true,
      },
    });

    res.status(200).json({
      message: "Attachment successfully removed",
      id: updated.id,
      deletedAt: updated.deletedAt,
      deletionReason: updated.deletionReason,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove attachment" });
  }
});

export default app;


