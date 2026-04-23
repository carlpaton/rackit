/**
 * Seed users from scripts/data.txt into MongoDB via Mongoose.
 *
 * Each non-blank line in data.txt is treated as an email address.
 * Display name is derived from the part before the @.
 * Existing users (matched by email) are skipped.
 *
 * Usage:
 *   node scripts/seed-users.js
 *   node scripts/seed-users.js --password secret123
 *
 * Requires .env.local to be present with MONGODB_URI set.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const DATA_FILE = path.join(__dirname, "data.txt");

const passwordArg = process.argv.indexOf("--password");
const password =
  passwordArg !== -1 ? process.argv[passwordArg + 1] : "password1";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: null },
    displayName: { type: String, default: null },
  },
  { timestamps: true }
);

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI not set in .env.local");
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

  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model("User", UserSchema);
  const passwordHash = await bcrypt.hash(password, 10);

  let created = 0;
  let skipped = 0;

  try {
    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log("Skipped (exists):", u.email);
        skipped++;
        continue;
      }
      await User.create({
        email: u.email,
        displayName: u.displayName,
        passwordHash,
      });
      console.log("Created:", u.email);
      created++;
    }
  } finally {
    await mongoose.disconnect();
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
