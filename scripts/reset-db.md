# reset-db.js

Wipes all app data from the database. Useful for clearing seeded test data before a fresh run.

## Prerequisites

- `.env.local` present with `MONGODB_URI` set

## Usage

```bash
node scripts/reset-db.js
```

## What gets deleted

All documents are removed from the following collections:

| Collection | Notes |
|---|---|
| `users` | |
| `tournaments` | |
| `teams` | |
| `groups` | |
| `matches` | |
| `quickgames` | |
| `accounts` | NextAuth adapter collection |
| `sessions` | NextAuth adapter collection |
| `verificationtokens` | NextAuth adapter collection |

## After running

Re-seed with:

```bash
node scripts/seed-users.js
node scripts/seed-tournament.js
```
