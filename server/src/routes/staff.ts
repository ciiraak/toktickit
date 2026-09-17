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

export default router;
