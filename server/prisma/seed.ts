import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  const categoryMap = new Map<string, number>();
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap.set(name, cat.id);
  }
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 2. Seed Related Systems
  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  const systemMap = new Map<string, number>();
  for (const name of systems) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    systemMap.set(name, sys.id);
  }
  console.log(`✓ Seeded ${systems.length} related systems.`);

  // 3. Seed Users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    // Requesters
    { name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th", isActive: true, role: "REQUESTER" as const },
    { name: "Michael Brown", email: "michael.brown@kmutt.ac.th", isActive: true, role: "REQUESTER" as const },
    { name: "Sarah Johnson", email: "sarah.johnson@kmutt.ac.th", isActive: true, role: "REQUESTER" as const },
    { name: "David Lee", email: "david.lee@kmutt.ac.th", isActive: true, role: "REQUESTER" as const },
    { name: "John Doe", email: "john.doe@kmutt.ac.th", isActive: false, role: "REQUESTER" as const },
    // IT Staff
    { name: "IT Staff One", email: "staff1@kmutt.ac.th", isActive: true, role: "IT_STAFF" as const },
    { name: "IT Staff Two", email: "staff2@kmutt.ac.th", isActive: true, role: "IT_STAFF" as const },
    { name: "IT Staff Three", email: "staff3@kmutt.ac.th", isActive: true, role: "IT_STAFF" as const },
    { name: "IT Staff Inactive", email: "staff.inactive@kmutt.ac.th", isActive: false, role: "IT_STAFF" as const },
    // Administrator
    { name: "Admin User", email: "admin@kmutt.ac.th", isActive: true, role: "ADMINISTRATOR" as const },
  ];

  const userMap = new Map<string, number>();
  for (const user of users) {
    const u = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, isActive: user.isActive, role: user.role },
      create: {
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
        passwordHash,
        requiresPasswordChange: true,
      },
    });
    userMap.set(user.email, u.id);
  }
  console.log(`✓ Seeded ${users.length} users.`);

  // 4. Seed Realistic Tickets with all 8 statuses and assigned/unassigned
  const ticketsData = [
    {
      ticketNumber: "TKT-2026-000001",
      requesterEmail: "jennifer.anderson@kmutt.ac.th",
      ownerEmail: "staff1@kmutt.ac.th",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "Laptop battery drains quickly",
      description: "Battery drains from 100% to 0% in under an hour while running standard office apps.",
      requestedPriority: "MEDIUM",
      itPriority: "MEDIUM",
      currentStatus: "In Progress",
      actions: [
        {
          actionDateTime: new Date("2026-10-10T09:30:00Z"),
          description: "Performed battery diagnostic test",
          result: "Battery health reported at 42% capacity with degraded cells",
          performedByEmail: "staff1@kmutt.ac.th",
          followUpRequired: true,
          followUpNote: "Order replacement OEM battery pack from supplier",
          attachmentNotes: "battery_report.pdf",
        },
        {
          actionDateTime: new Date("2026-10-11T14:15:00Z"),
          description: "Received and installed replacement battery",
          result: "Battery charged to 100% successfully and calibrated",
          performedByEmail: "staff2@kmutt.ac.th",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000002",
      requesterEmail: "jennifer.anderson@kmutt.ac.th",
      ownerEmail: null,
      categoryName: "Network",
      systemName: "VPN",
      summary: "VPN disconnects randomly",
      description: "Every 20 minutes VPN tunnel drops connection during remote work sessions.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "Open",
      actions: [], // Zero actions
    },
    {
      ticketNumber: "TKT-2026-000003",
      requesterEmail: "jennifer.anderson@kmutt.ac.th",
      ownerEmail: "staff1@kmutt.ac.th",
      categoryName: "Software",
      systemName: "LEB2 App",
      summary: "Cannot submit quiz on LEB2 App",
      description: "Encountering error 500 when clicking submit button on Week 4 assignment.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "Waiting for Requester",
      actions: [
        {
          actionDateTime: new Date("2026-10-11T10:00:00Z"),
          description: "Cleared cache on student account and inspected web server logs",
          result: "Session timeout cleared. Requested student to try re-uploading file",
          performedByEmail: "staff1@kmutt.ac.th",
          followUpRequired: true,
          followUpNote: "Verify student confirmation before closing",
          attachmentNotes: "screenshot_error.png",
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000004",
      requesterEmail: "jennifer.anderson@kmutt.ac.th",
      ownerEmail: "staff2@kmutt.ac.th",
      categoryName: "Account and Access",
      systemName: "Email",
      summary: "Email password reset required",
      description: "Locked out of university webmail after returning from leave.",
      requestedPriority: "LOW",
      itPriority: "LOW",
      currentStatus: "Resolved",
      actions: [
        {
          actionDateTime: new Date("2026-10-09T11:00:00Z"),
          description: "Verified identity via student affairs and sent temporary recovery link",
          result: "Password reset completed and login verified",
          performedByEmail: "staff2@kmutt.ac.th",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000005",
      requesterEmail: "jennifer.anderson@kmutt.ac.th",
      ownerEmail: "staff1@kmutt.ac.th",
      categoryName: "Hardware",
      systemName: "Printer",
      summary: "Paper jam error on Department 3rd floor printer",
      description: "Tray 2 jammed and warning LED is blinking red.",
      requestedPriority: "MEDIUM",
      itPriority: "LOW",
      currentStatus: "Closed",
      actions: [
        {
          actionDateTime: new Date("2026-10-08T16:00:00Z"),
          description: "Cleared stuck rollers and performed test print",
          result: "5 test pages printed cleanly",
          performedByEmail: "staff1@kmutt.ac.th",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000006",
      requesterEmail: "michael.brown@kmutt.ac.th",
      ownerEmail: null,
      categoryName: "Software",
      systemName: "Grade Submission App",
      summary: "Grade calculation rounding bug",
      description: "GPA shows 3.84 instead of 3.85 due to truncating float value.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "New",
      actions: [], // Zero actions
    },
    {
      ticketNumber: "TKT-2026-000007",
      requesterEmail: "michael.brown@kmutt.ac.th",
      ownerEmail: "staff2@kmutt.ac.th",
      categoryName: "Network",
      systemName: "Campus Wi-Fi",
      summary: "No Wi-Fi signal in Library 4th floor study room",
      description: "SSID KMUTT-Secure drops completely when walking past room 402.",
      requestedPriority: "MEDIUM",
      itPriority: "MEDIUM",
      currentStatus: "Reopened",
      actions: [
        {
          actionDateTime: new Date("2026-10-09T08:00:00Z"),
          description: "Rebooted access point AP-LIB-402",
          result: "AP came online but signal remains intermittent",
          performedByEmail: "staff2@kmutt.ac.th",
          followUpRequired: true,
          followUpNote: "Schedule antenna replacement with campus network team",
          attachmentNotes: null,
        },
        {
          actionDateTime: new Date("2026-10-10T11:00:00Z"),
          description: "Dispatched technician to inspect PoE injector",
          result: "PoE injector replaced; signal steady at -52 dBm",
          performedByEmail: "admin@kmutt.ac.th",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000008",
      requesterEmail: "sarah.johnson@kmutt.ac.th",
      ownerEmail: null,
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "Spilled water on keyboard",
      description: "Request cancelled by user who used personal device instead.",
      requestedPriority: "LOW",
      itPriority: "LOW",
      currentStatus: "Cancelled",
      actions: [], // Zero actions
    },
  ];

  for (const t of ticketsData) {
    const requesterId = userMap.get(t.requesterEmail)!;
    const ownerId = t.ownerEmail ? userMap.get(t.ownerEmail) : null;
    const categoryId = categoryMap.get(t.categoryName)!;
    const relatedSystemId = systemMap.get(t.systemName)!;

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        requesterId,
        ownerId,
        categoryId,
        relatedSystemId,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
      },
      create: {
        ticketNumber: t.ticketNumber,
        requesterId,
        ownerId,
        categoryId,
        relatedSystemId,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
      },
    });

    // Seed Actions Taken idempotently
    if (t.actions && t.actions.length > 0) {
      for (const act of t.actions) {
        const performedById = userMap.get(act.performedByEmail)!;
        const existingAction = await prisma.actionTaken.findFirst({
          where: {
            ticketId: ticket.id,
            description: act.description,
          },
        });

        if (!existingAction) {
          await prisma.actionTaken.create({
            data: {
              ticketId: ticket.id,
              actionDateTime: act.actionDateTime,
              description: act.description,
              result: act.result,
              performedById,
              followUpRequired: act.followUpRequired,
              followUpNote: act.followUpNote,
              attachmentNotes: act.attachmentNotes,
            },
          });
        }
      }
    }
  }

  console.log(`✓ Seeded ${ticketsData.length} tickets with realistic Actions Taken.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
