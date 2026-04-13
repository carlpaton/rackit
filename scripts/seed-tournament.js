/**
 * Seed a test tournament with teams sourced from scripts/data.txt.
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
 * Requires .env.local to be present with MONGODB_URI set.
 */

const { MongoClient } = require("mongodb");
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
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  // Parse data.txt — blank lines separate groups/pairs
  const lines = fs
    .readFileSync(DATA_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim());

  const groups = [];
  let current = [];
  for (const line of lines) {
    if (line === "") {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
    } else if (line.includes("@")) {
      current.push(line.toLowerCase());
    }
  }
  if (current.length > 0) groups.push(current);

  const allEmails = [...new Set(groups.flat())];
  console.log(`Parsed ${groups.length} group(s), ${allEmails.length} unique email(s)`);

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const usersCol = db.collection("users");
  const tournamentsCol = db.collection("tournaments");
  const teamsCol = db.collection("teams");

  // Resolve emails → user IDs
  const userDocs = await usersCol.find({ email: { $in: allEmails } }).toArray();
  const emailToId = Object.fromEntries(userDocs.map((u) => [u.email, u._id]));

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
      await client.close();
      process.exit(1);
    }
    console.log("Organizer:", organizerEmail);
  } else {
    const first = userDocs[0];
    if (!first) {
      console.error("Error: no users found in DB");
      await client.close();
      process.exit(1);
    }
    organizerId = first._id;
    console.log("Organizer (defaulting to first user):", first.email);
  }

  // Create tournament
  const now = new Date();
  const { insertedId: tournamentId } = await tournamentsCol.insertOne({
    name: tournamentName,
    mode,
    status: "open",
    path: null,
    organizerUserId: organizerId,
    winnerTeamId: null,
    createdAt: now,
  });
  console.log(`\nCreated tournament: "${tournamentName}" (${mode}) — id: ${tournamentId}`);

  // Create teams
  let teamsCreated = 0;

  if (mode === "doubles") {
    for (const group of groups) {
      const memberIds = group.map((e) => emailToId[e]).filter(Boolean);
      if (memberIds.length === 0) {
        console.log(`  Skipped [${group.join(", ")}] — no matching users`);
        continue;
      }
      const names = group
        .filter((e) => emailToId[e])
        .map((e) => e.split("@")[0]);

      if (memberIds.length === 1) {
        await teamsCol.insertOne({
          tournamentId,
          userIds: memberIds,
          status: "open",
          createdAt: now,
        });
        console.log(`  Created open team: ${names[0]} (partner not found)`);
      } else {
        await teamsCol.insertOne({
          tournamentId,
          userIds: memberIds.slice(0, 2),
          status: "full",
          createdAt: now,
        });
        console.log(`  Created team: ${names.slice(0, 2).join(" & ")}`);
      }
      teamsCreated++;
    }
  } else {
    // Singles — one team per unique user
    for (const email of allEmails) {
      const userId = emailToId[email];
      if (!userId) continue;
      await teamsCol.insertOne({
        tournamentId,
        userIds: [userId],
        status: "full",
        createdAt: now,
      });
      console.log(`  Created team: ${email.split("@")[0]}`);
      teamsCreated++;
    }
  }

  console.log(`\nDone — ${teamsCreated} teams created in "${tournamentName}"`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
