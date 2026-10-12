import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../authMiddleware.js";

const router = Router();

// Apply auth + role guard to all staff routes
router.use(requireAuth, requireRole(["IT_STAFF", "ADMINISTRATOR"]));

// GET /api/staff/tickets — paginated, searchable, filterable queue
router.get("/tickets", async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      priority,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && typeof status === "string") {
      where.currentStatus = status;
    }

    if (priority && typeof priority === "string") {
      where.requestedPriority = priority.toUpperCase();
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
      ];
    }

    const validSortFields = ["createdAt", "ticketNumber", "updatedAt", "currentStatus"];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
    const order = (sortOrder as string).toLowerCase() === "asc" ? "asc" : "desc";

    const prisma = getPrisma();
    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { [sortField]: order },
        skip,
        take: limitNum,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { name: true } },
          relatedSystem: { select: { name: true } },
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true } },
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
    res.status(500).json({ error: "Failed to fetch ticket queue" });
  }
});

// GET /api/staff/tickets/:id — full ticket detail for IT staff
router.get("/tickets/:id", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true } },
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
        notes: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        actionsTaken: {
          include: { performedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { actionDateTime: "asc" },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket detail" });
  }
});

const VALID_STATUSES = [
  "New", "Open", "In Progress", "Waiting for Requester",
  "Resolved", "Closed", "Reopened", "Cancelled",
];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

// PATCH /api/staff/tickets/:id — update owner, itPriority, status
router.patch("/tickets/:id", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const { ownerId, itPriority, status } = req.body;
  const updates: any = {};

  if (ownerId !== undefined) {
    if (ownerId === null) {
      updates.ownerId = null;
    } else {
      const prisma = getPrisma();
      const owner = await prisma.user.findUnique({ where: { id: Number(ownerId) } });
      if (!owner || !owner.isActive || (owner.role !== "IT_STAFF" && owner.role !== "ADMINISTRATOR")) {
        res.status(400).json({ error: "Invalid owner: must be an active IT Staff or Administrator." });
        return;
      }
      updates.ownerId = Number(ownerId);
    }
  }

  if (itPriority !== undefined) {
    if (!VALID_PRIORITIES.includes(itPriority)) {
      res.status(400).json({ error: `Invalid itPriority. Must be one of: ${VALID_PRIORITIES.join(", ")}` });
      return;
    }
    updates.itPriority = itPriority;
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }
    updates.currentStatus = status;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided to update." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updates,
      include: {
        owner: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// POST /api/staff/tickets/:id/internal-notes — append private internal note
router.post("/tickets/:id/internal-notes", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content) {
    res.status(400).json({ error: "Note content is required and cannot be empty." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const note = await prisma.note.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to create internal note" });
  }
});

// POST /api/staff/tickets/:id/public-comments — append public comment (staff side)
router.post("/tickets/:id/public-comments", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// GET /api/staff/tickets/:id/actions-taken — list actions taken for a ticket
router.get("/tickets/:id/actions-taken", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: { actionDateTime: "asc" },
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json(actions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch actions taken" });
  }
});

// POST /api/staff/tickets/:id/actions-taken — create an action taken
router.post("/tickets/:id/actions-taken", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  if (isNaN(ticketId)) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const result = typeof req.body.result === "string" ? req.body.result.trim() : "";
  const followUpRequired = Boolean(req.body.followUpRequired);
  const followUpNote = typeof req.body.followUpNote === "string" ? req.body.followUpNote.trim() : null;
  const attachmentNotes = typeof req.body.attachmentNotes === "string" ? req.body.attachmentNotes.trim() : null;

  let actionDateTime = new Date();
  if (req.body.actionDateTime) {
    const parsedDate = new Date(req.body.actionDateTime);
    if (!isNaN(parsedDate.getTime())) {
      actionDateTime = parsedDate;
    }
  }

  if (!description) {
    res.status(400).json({ error: "Action description is required and cannot be empty." });
    return;
  }

  if (!result) {
    res.status(400).json({ error: "Action result is required and cannot be empty." });
    return;
  }

  if (followUpRequired && !followUpNote) {
    res.status(400).json({ error: "Follow-up note is required when follow-up is needed." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const action = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime,
        description,
        result,
        performedById: req.user!.id,
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote : null,
        attachmentNotes: attachmentNotes || null,
      },
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ error: "Failed to create action taken" });
  }
});

// PATCH /api/staff/tickets/:id/actions-taken/:actionId — update an action taken
router.patch("/tickets/:id/actions-taken/:actionId", async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const actionId = parseInt(req.params.actionId);
  if (isNaN(ticketId) || isNaN(actionId)) {
    res.status(404).json({ error: "Action taken not found" });
    return;
  }

  try {
    const prisma = getPrisma();
    const existingAction = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });

    if (!existingAction) {
      res.status(404).json({ error: "Action taken not found" });
      return;
    }

    const updates: any = {};
    if (req.body.description !== undefined) {
      const desc = typeof req.body.description === "string" ? req.body.description.trim() : "";
      if (!desc) {
        res.status(400).json({ error: "Action description cannot be empty." });
        return;
      }
      updates.description = desc;
    }

    if (req.body.result !== undefined) {
      const resText = typeof req.body.result === "string" ? req.body.result.trim() : "";
      if (!resText) {
        res.status(400).json({ error: "Action result cannot be empty." });
        return;
      }
      updates.result = resText;
    }

    if (req.body.followUpRequired !== undefined) {
      updates.followUpRequired = Boolean(req.body.followUpRequired);
    }

    const finalFollowUpRequired = updates.followUpRequired !== undefined 
      ? updates.followUpRequired 
      : existingAction.followUpRequired;

    if (req.body.followUpNote !== undefined) {
      const note = typeof req.body.followUpNote === "string" ? req.body.followUpNote.trim() : null;
      updates.followUpNote = note;
    }

    if (finalFollowUpRequired) {
      const noteToCheck = updates.followUpNote !== undefined ? updates.followUpNote : existingAction.followUpNote;
      if (!noteToCheck) {
        res.status(400).json({ error: "Follow-up note is required when follow-up is needed." });
        return;
      }
    } else {
      if (updates.followUpRequired === false) {
        updates.followUpNote = null;
      }
    }

    if (req.body.attachmentNotes !== undefined) {
      updates.attachmentNotes = typeof req.body.attachmentNotes === "string" ? req.body.attachmentNotes.trim() : null;
    }

    if (req.body.actionDateTime !== undefined) {
      const parsedDate = new Date(req.body.actionDateTime);
      if (!isNaN(parsedDate.getTime())) {
        updates.actionDateTime = parsedDate;
      }
    }

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: updates,
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update action taken" });
  }
});

// GET /api/staff/assignees — list active IT staff and administrators for ticket assignment
router.get("/assignees", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const assignees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["IT_STAFF", "ADMINISTRATOR"] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(assignees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignees" });
  }
});

export default router;
