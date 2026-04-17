/**
 * Truncate all app tables in FK-safe order.
 * Wipes MatchDelegation, Match, GroupTeam, Group, UserTeam, Team, Tournament, User.
 *
 * Usage:
 *   node scripts/reset-db.js
 *
 * Requires .env.local to be present with DATABASE_URL set.
 */

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const d1 = await prisma.matchDelegation.deleteMany({});
    console.log(`Deleted ${d1.count} MatchDelegation rows`);

    const d2 = await prisma.match.deleteMany({});
    console.log(`Deleted ${d2.count} Match rows`);

    const d3 = await prisma.groupTeam.deleteMany({});
    console.log(`Deleted ${d3.count} GroupTeam rows`);

    const d4 = await prisma.group.deleteMany({});
    console.log(`Deleted ${d4.count} Group rows`);

    const d5 = await prisma.userTeam.deleteMany({});
    console.log(`Deleted ${d5.count} UserTeam rows`);

    // Break the circular FK between Tournament.winnerTeamId → Team before deleting teams
    await prisma.tournament.updateMany({ data: { winnerTeamId: null } });

    const d6 = await prisma.team.deleteMany({});
    console.log(`Deleted ${d6.count} Team rows`);

    const d7 = await prisma.tournament.deleteMany({});
    console.log(`Deleted ${d7.count} Tournament rows`);

    const d8 = await prisma.user.deleteMany({});
    console.log(`Deleted ${d8.count} User rows (cascades Account + Session)`);

    console.log("\nDone — all tables cleared");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
