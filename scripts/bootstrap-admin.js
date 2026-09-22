const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const required = ["INITIAL_ADMIN_NAME", "INITIAL_ADMIN_EMAIL", "INITIAL_ADMIN_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const email = process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
if (password.length < 12) {
  console.error("INITIAL_ADMIN_PASSWORD must be at least 12 characters long.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("An account with this email already exists; no changes made.");
    return;
  }

  await prisma.user.create({
    data: {
      name: process.env.INITIAL_ADMIN_NAME.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Initial administrator created successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to create initial administrator:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
