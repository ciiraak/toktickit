import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber, validateAttachmentFile, validateTicketFields } from "./ticketHelpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer — store to server/uploads/, 5 MB per file hard limit
const upload = multer({
  dest: path.join(__dirname, "../../uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

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
    const requesters = await getPrisma().requester.findMany({
      where: { isActive: true },
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

app.post("/api/tickets", upload.array("attachments", 5), async (req: Request, res: Response) => {
  const requesterId = parseInt(req.headers["x-requester-id"] as string);
  if (!requesterId || isNaN(requesterId)) {
    res.status(401).json({ error: "Missing x-requester-id header" });
    return;
  }

  // Validate active requester (BR-04, BR-11)
  const prisma = getPrisma();
  const requester = await prisma.requester.findUnique({ where: { id: requesterId } });
  if (!requester || !requester.isActive) {
    res.status(403).json({ error: "Requester not found or inactive" });
    return;
  }

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
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

export default app;
