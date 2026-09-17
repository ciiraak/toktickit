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

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
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

  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.log(`✓ Seeded ${systems.length} related systems.`);

  // 3. Seed Users
  const passwordHash = await bcrypt.hash("Password123!", 10);
  
  const users = [
    // Requesters
    { name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th", isActive: true, role: "REQUESTER" },
    { name: "Michael Brown", email: "michael.brown@kmutt.ac.th", isActive: true, role: "REQUESTER" },
    { name: "Sarah Johnson", email: "sarah.johnson@kmutt.ac.th", isActive: true, role: "REQUESTER" },
    { name: "David Lee", email: "david.lee@kmutt.ac.th", isActive: true, role: "REQUESTER" },
    { name: "John Doe", email: "john.doe@kmutt.ac.th", isActive: false, role: "REQUESTER" },
    // IT Staff
    { name: "IT Staff One", email: "staff1@kmutt.ac.th", isActive: true, role: "IT_STAFF" },
    { name: "IT Staff Two", email: "staff2@kmutt.ac.th", isActive: true, role: "IT_STAFF" },
    { name: "IT Staff Three", email: "staff3@kmutt.ac.th", isActive: true, role: "IT_STAFF" },
    { name: "IT Staff Inactive", email: "staff.inactive@kmutt.ac.th", isActive: false, role: "IT_STAFF" },
    // Administrator
    { name: "Admin User", email: "admin@kmutt.ac.th", isActive: true, role: "ADMINISTRATOR" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, isActive: user.isActive, role: user.role as any },
      create: { 
        name: user.name, 
        email: user.email, 
        isActive: user.isActive, 
        role: user.role as any,
        passwordHash,
        requiresPasswordChange: true
      },
    });
  }
  
  console.log(`✓ Seeded ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
