# reset-db.js

Wipes all app data from the database. Useful for clearing seeded test data before a fresh run.

## Prerequisites

- `.env.local` present with `DATABASE_URL` set

## Usage

```bash
node scripts/reset-db.js
```

## What gets deleted

Tables are cleared in FK-safe order:

| Table | Notes |
|---|---|
| `MatchDelegation` | |
| `Match` | |
| `GroupTeam` | |
| `Group` | |
| `UserTeam` | |
| `Team` | `Tournament.winnerTeamId` is nulled first to break the circular FK |
| `Tournament` | |
| `User` | Cascades to `Account` and `Session` |

## After running

Re-seed with:

```bash
node scripts/seed-users.js
node scripts/seed-tournament.js
```
