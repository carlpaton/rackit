/**
 * Seed users from scripts/data.txt into Supabase via Prisma.
 *
 * Each non-blank line in data.txt is treated as an email address.
 * Display name is derived from the part before the @.
 * Existing users (matched by email) are skipped.
 *
 * Usage:
 *   node scripts/seed-users.js
 *   node scripts/seed-users.js --password secret123
 *
 * Requires .env.local to be present with DATABASE_URL set.
 */

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const DATA_FILE = path.join(__dirname, "data.txt");

const passwordArg = process.argv.indexOf("--password");
const password =
  passwordArg !== -1 ? process.argv[passwordArg + 1] : "password1";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  const lines = fs.readFileSync(DATA_FILE, "utf8").split("\n");
  const users = lines
    .map((l) => l.trim())
    .filter((l) => l.includes("@"))
    .map((email) => ({
      email: email.toLowerCase(),
      displayName: email.split("@")[0],
    }));

  if (users.length === 0) {
    console.log("No emails found in", DATA_FILE);
    return;
  }

  console.log(`Found ${users.length} users in data.txt`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(password, 10);

  let created = 0;
  let skipped = 0;

  try {
    for (const u of users) {
      const exists = await prisma.user.findUnique({ where: { email: u.email } });
      if (exists) {
        console.log("Skipped (exists):", u.email);
        skipped++;
        continue;
      }
      await prisma.user.create({
        data: {
          email: u.email,
          displayName: u.displayName,
          passwordHash,
        },
      });
      console.log("Created:", u.email);
      created++;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
