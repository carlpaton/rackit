# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rackit** is a Pool Tournament App. Users register with Google and can create or join public tournaments. The app manages the full tournament lifecycle: group stage round-robin → knockout stage → final.

GitHub: https://github.com/carlpaton/rackit

---

## Tournament Modes

- **Singles** — 1 player per team
- **Doubles** — 2 players per team
- Mode is set at tournament creation and cannot be mixed within a tournament
- A player can participate in multiple tournaments simultaneously

---

## Tournament Format

### Small Tournaments (4 or fewer teams — no group stage)
- If the team count is 4 or fewer, go straight to knockout — no groups required
- Example: 2 teams → straight to a Final; 4 teams → 2 semi-finals then a Final

### Group Stage (triggered when team count exceeds 4)
- Teams are split into groups (typically 4 groups of 3–4 teams)
- Within each group, teams play a **round-robin** (every team plays every other team once)
- **Scoring:** Win = 1 point, Loss = 0 points. There are no draws in pool
- **Top 2 teams from each group advance** to the knockout stage
- **Tiebreaker** (when teams are level on points): head-to-head result between the tied teams

### Knockout Stage
- **Random seeding** — bracket is randomly drawn, no cross-group seeding logic
- **Single elimination** — one loss and you're out
- Format: Quarter-finals → Semi-finals → Final
- **Byes** — if advancing teams don't fill a clean power-of-2 bracket, byes are randomly assigned; a team with a bye automatically advances

---

## Match Results

- Results are **win (1) or loss (0)** only — no scores, no frames
- **By default, only the tournament organizer records results**
- The organizer can **delegate result entry to players** for their own matches (removes bottleneck while maintaining control)

---

## User Roles & Access

- **Google login required** to access anything in the app
- Any registered user can:
  - Create a tournament (becoming its organizer)
  - Join any public tournament
  - View all tournaments and rankings
- **Tournament organizer** can delegate match result entry to players
- **v1 is public only** — private/invite-only tournaments are a future feature

---

## Future Features (out of scope for v1)
- Private / invite-only tournaments

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Frontend | React 19.2 |
| Database | MongoDB Atlas (via Mongoose ODM) |
| Auth | NextAuth.js v5 (Auth.js) — Credentials provider + MongoDB adapter |
| Hosting | Vercel |

> **Mongoose** is the ODM used to interact with MongoDB Atlas. Models are defined in `src/models/`. The connection singleton lives in `src/lib/mongoose.ts` — call `await dbConnect()` at the start of every server action and page data-fetch before using any model. The native MongoClient (for the NextAuth adapter) lives in `src/lib/mongodb.ts`.

### Key Conventions
- Use the **App Router** (`src/app/` directory), not Pages Router
- `proxy.ts` is used instead of `middleware.ts` (Next.js 16 convention)
- Always call `await dbConnect()` before using Mongoose models in server actions and page components
- Auth session data is available via NextAuth.js `auth()` helper in server components and `useSession()` in client components
- Route protection is handled at the `proxy.ts` level, not per-page
- MongoDB IDs are ObjectId internally; call `.toString()` when you need a string for comparisons or JSX keys

### Mongoose Models
All models live in `src/models/`:
- `user.ts` — User (email unique, passwordHash, displayName, plus NextAuth fields)
- `tournament.ts` — Tournament (name, mode, status, path, isPublic, joinCode unique, organizerUserId, winnerTeamId)
- `team.ts` — Team with embedded `userIds: ObjectId[]` (replaces UserTeam join table)
- `group.ts` — Group with embedded `teamIds: ObjectId[]` (replaces GroupTeam join table)
- `match.ts` — Match with embedded `delegatedTeamIds: ObjectId[]` (replaces MatchDelegation join table)
- `quick-game.ts` — QuickGame (joinCode unique, creatorId, opponentId, winnerId, status)

### Schema Change Workflow
- **Add a field**: edit the Mongoose model file in `src/models/` — no migration needed for MongoDB
- **New model**: create a new file in `src/models/` following the existing pattern (`mongoose.models.X ?? mongoose.model('X', schema)`)
- **Inspect data**: connect MongoDB Compass to `MONGODB_URI`

### Environment Variables
- `MONGODB_URI` — MongoDB Atlas connection string (`mongodb+srv://...`), used at application runtime
- `NEXTAUTH_SECRET` — random string; generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — canonical app URL (`http://localhost:3000` for local dev)

### Status Values (stored as-is in MongoDB)
Unlike Prisma's mapped enums, Mongoose stores the exact string values used in code:

| Field | Values |
|---|---|
| `tournament.status` | `"open"`, `"in_progress"`, `"complete"` |
| `tournament.path` | `"group_stage"`, `"direct_knockout"` |
| `tournament.mode` | `"singles"`, `"doubles"` |
| `team.status` | `"open"`, `"full"` |
| `match.phase` | `"group"`, `"knockout"` |
| `match.round` | `"QF"`, `"SF"`, `"Final"` |
| `quickGame.status` | `"waiting"`, `"active"`, `"complete"` |

---

@AGENTS.md
