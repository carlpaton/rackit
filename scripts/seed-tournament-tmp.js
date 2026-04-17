/**
 * Seed a test tournament with teams sourced from scripts/test-data.txt.
 *
 * Users are read in pairs (blank lines separate pairs) and joined as doubles
 * teams. Pass --mode singles to create one team per user instead.
 *
 * Usage:
 *   node scripts/seed-tournament.js
 *   node scripts/seed-tournament.js --name "Friday League"
 *   node scripts/seed-tournament.js --mode singles
 *   node scripts/seed-tournament.js --organizer carl@gmail.com
 *
 * Requires .env.local to be present with DATABASE_URL set.
 */

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const DATA_FILE = path.join(__dirname, "data.txt");

function getArg(flag, defaultVal) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : defaultVal;
}

const tournamentName = getArg("--name", "Seed Test Tournament");
const mode = getArg("--mode", "doubles");
const organizerEmail = getArg("--organizer", null);

if (!["singles", "doubles"].includes(mode)) {
  console.error("Error: --mode must be 'singles' or 'doubles'");
  process.exit(1);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  // Parse data.txt — blank lines separate groups/pairs
  const lines = fs
    .readFileSync(DATA_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim());

  // Each group: { emails: string[], name?: string }
  const groups = [];
  let current = { emails: [], name: undefined };
  for (const line of lines) {
    if (line === "") {
      if (current.emails.length > 0) {
        groups.push(current);
        current = { emails: [], name: undefined };
      }
    } else if (line.includes("@")) {
      current.emails.push(line.toLowerCase());
    } else {
      current.name = line;
    }
  }
  if (current.emails.length > 0) groups.push(current);

  const allEmails = [...new Set(groups.flatMap((g) => g.emails))];
  console.log(`Parsed ${groups.length} group(s), ${allEmails.length} unique email(s)`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Resolve emails → user IDs
    const userDocs = await prisma.user.findMany({
      where: { email: { in: allEmails } },
      select: { id: true, email: true },
    });
    const emailToId = Object.fromEntries(userDocs.map((u) => [u.email, u.id]));

    const missing = allEmails.filter((e) => !emailToId[e]);
    if (missing.length > 0) {
      console.warn("Warning: users not found in DB (skipping):", missing.join(", "));
    }

    // Resolve organizer
    let organizerId;
    if (organizerEmail) {
      organizerId = emailToId[organizerEmail.toLowerCase()];
      if (!organizerId) {
        console.error("Error: organizer email not found:", organizerEmail);
        process.exit(1);
      }
      console.log("Organizer:", organizerEmail);
    } else {
      const first = userDocs[0];
      if (!first) {
        console.error("Error: no users found in DB");
        process.exit(1);
      }
      organizerId = first.id;
      console.log("Organizer (defaulting to first user):", first.email);
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentName,
        mode,
        organizerUserId: organizerId,
      },
    });
    console.log(`\nCreated tournament: "${tournamentName}" (${mode}) — id: ${tournament.id}`);

    // Create teams
    let teamsCreated = 0;

    if (mode === "doubles") {
      for (const group of groups) {
        const memberIds = group.emails.map((e) => emailToId[e]).filter(Boolean);
        if (memberIds.length === 0) {
          console.log(`  Skipped [${group.emails.join(", ")}] — no matching users`);
          continue;
        }
        const playerNames = group.emails
          .filter((e) => emailToId[e])
          .map((e) => e.split("@")[0]);

        const isFullTeam = memberIds.length >= 2;
        const teamMembers = isFullTeam ? memberIds.slice(0, 2) : memberIds;

        const team = await prisma.team.create({
          data: {
            tournamentId: tournament.id,
            name: group.name ?? null,
            status: isFullTeam ? "full" : "open",
            users: {
              create: teamMembers.map((userId) => ({ userId })),
            },
          },
        });

        const label = group.name
          ? `"${group.name}" — ${playerNames.slice(0, 2).join(" & ")}`
          : playerNames.slice(0, 2).join(" & ");
        console.log(
          isFullTeam
            ? `  Created team: ${label}`
            : `  Created open team: ${playerNames[0]} (partner not found)`
        );
        teamsCreated++;
      }
    } else {
      // Singles — one team per unique user
      for (const email of allEmails) {
        const userId = emailToId[email];
        if (!userId) continue;
        await prisma.team.create({
          data: {
            tournamentId: tournament.id,
            status: "full",
            users: {
              create: [{ userId }],
            },
          },
        });
        console.log(`  Created team: ${email.split("@")[0]}`);
        teamsCreated++;
      }
    }

    console.log(`\nDone — ${teamsCreated} teams created in "${tournamentName}"`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
