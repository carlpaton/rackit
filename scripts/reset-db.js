/**
 * Delete all documents from every app and NextAuth collection.
 *
 * Usage:
 *   node scripts/reset-db.js
 *
 * Requires .env.local to be present with MONGODB_URI set.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const COLLECTIONS = [
  "users",
  "tournaments",
  "teams",
  "groups",
  "matches",
  "quickgames",
  "accounts",
  "sessions",
  "verificationtokens",
];

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  try {
    for (const name of COLLECTIONS) {
      const result = await db.collection(name).deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${name}`);
    }
    console.log("\nDone — all collections cleared");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
