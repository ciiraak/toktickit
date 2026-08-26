import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories (idempotent upsert)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 2. Seed Related Systems (idempotent upsert)
  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.log(`✓ Seeded ${systems.length} related systems.`);

  // 3. Seed Development Requesters (active and inactive)
  const requesters = [
    { name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th", isActive: true },
    { name: "Michael Brown", email: "michael.brown@kmutt.ac.th", isActive: true },
    { name: "Sarah Johnson", email: "sarah.johnson@kmutt.ac.th", isActive: true },
    { name: "David Lee", email: "david.lee@kmutt.ac.th", isActive: true },
    { name: "John Doe", email: "john.doe@kmutt.ac.th", isActive: false },
  ];

  for (const req of requesters) {
    await prisma.requester.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: { name: req.name, email: req.email, isActive: req.isActive },
    });
  }
  console.log(`✓ Seeded ${requesters.length} development requesters (${requesters.filter(r => r.isActive).length} active, ${requesters.filter(r => !r.isActive).length} inactive).`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
