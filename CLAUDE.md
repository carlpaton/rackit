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
| Database | Supabase PostgreSQL (via Prisma ORM) |
| Auth | NextAuth.js v5 (Auth.js) — Credentials provider + Prisma adapter |
| Hosting | Vercel |

> **Prisma** is the ORM used to interact with the Supabase PostgreSQL database. The schema is defined in `prisma/schema.prisma`. Connection is configured via `prisma.config.ts` (uses `DIRECT_URL` for migrations) and `src/lib/prisma.ts` (uses `DATABASE_URL` pooled connection at runtime via `@prisma/adapter-pg`).

### Key Conventions
- Use the **App Router** (`src/app/` directory), not Pages Router
- `proxy.ts` is used instead of `middleware.ts` (Next.js 16 convention)
- The Prisma client singleton lives in `src/lib/prisma.ts` — import it everywhere as `import prisma from "@/lib/prisma"`
- Auth session data is available via NextAuth.js `auth()` helper in server components and `useSession()` in client components
- Route protection is handled at the `proxy.ts` level, not per-page

### Prisma Workflow
- **Add a new field/model**: edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name <description>` locally
- **Apply migrations in production**: the `build` script runs `prisma generate && prisma migrate deploy && next build` automatically on Vercel
- **Inspect data**: run `npx prisma studio` locally (requires `DIRECT_URL` set in `.env.local`)
- **Regenerate client after schema changes**: `npx prisma generate`

### Environment Variables
- `DATABASE_URL` — pooled Supabase connection string (Transaction pooler, port 6543), used at application runtime
- `DIRECT_URL` — direct Supabase connection string (port 5432), used by Prisma CLI for migrations
- `NEXTAUTH_SECRET` — random string; generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — canonical app URL (`http://localhost:3000` for local dev)

### Prisma Enum Values
The Prisma schema uses `@map` for enum values that contain hyphens. The **Prisma-side identifiers** (used in code) differ from the **database-stored values**:

| Prisma code value | Stored in DB |
|---|---|
| `TournamentStatus.in_progress` | `"in-progress"` |
| `TournamentPath.group_stage` | `"group-stage"` |
| `TournamentPath.direct_knockout` | `"direct-knockout"` |

Always use the Prisma-side identifiers in code (e.g. `tournament.status === "in_progress"`).

---

@AGENTS.md
