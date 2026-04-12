# Steps When Scaffolding
These are for the Human to read, AGENTS can ignore.

## 1. Create GitHub Repository
- Create a new empty repository at https://github.com/carlpaton/rackit
- Clone locally

## 2. Scaffold the Next.js App
Run this **before** adding any other files (CLAUDE.md etc) — `create-next-app` rejects directories with unrecognised files:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias="@/*" --yes
```

This gives you:
- TypeScript
- Tailwind CSS v4
- ESLint
- App Router (`src/app/`)
- `@/*` import alias mapped to `src/`
- Turbopack (default in Next.js 16)

## 3. Update .gitignore
`create-next-app` generates a `.gitignore` automatically. Extend it with Claude-specific local files that should not be committed:

```
# Claude Code — local files
CLAUDE.local.md
.claude/settings.local.json
.claude/todos.json

# Next.js
.next/
out/
build/

# Node
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# OS
.DS_Store
Thumbs.db
```

## 4. Claude Init — Create CLAUDE.md
Run `/init` in Claude Code to generate a base `CLAUDE.md`. Then build it out through conversation with Claude — ask clarifying questions about the product brief and let Claude document the answers:
- Tournament format, match rules, user roles
- Tech stack and key coding conventions

Key conventions to document:
- App Router only (`src/app/`)
- `proxy.ts` replaces `middleware.ts` (Next.js 16)
- MongoDB lazy connection pattern
- Mongoose model registration pattern
- NextAuth.js auth helpers per component type

> **Note:** `CLAUDE.md` is committed and shared with the team. `CLAUDE.local.md` and `.claude/settings.local.json` are personal — add to `.gitignore`.

## 5. Initialise shadcn/ui
```bash
npx shadcn@latest init -d
```

This auto-detects Next.js + Tailwind v4 and:
- Creates `src/components/ui/` with a base `button.tsx`
- Creates `src/lib/utils.ts`
- Updates `src/app/globals.css` with shadcn CSS variables

> **Note:** Tailwind v4 uses CSS-based config — there is no `tailwind.config.js`. All theme customisation lives in `globals.css`.

## 6. Apply Rackit Branding
Update `src/app/globals.css` to override shadcn's dark theme with the Rackit pool palette:

| Token | Usage | Hex |
|---|---|---|
| `bg-felt` / `--felt` | Page backgrounds | `#1a3d2b` |
| `bg-surface` / `--surface` | Cards, panels | `#234d38` |
| `text-chalk` / `--chalk` | Primary text | `#f0ede4` |
| `accent-gold` / `--gold` | CTAs, highlights | `#c9a84c` |
| `result-win` / `--win` | Win indicators | `#4caf72` |
| `result-loss` / `--loss` | Loss / destructive | `#8b1a1a` |

Dark theme only — no light/dark toggle. Apply `class="dark"` to `<html>` in `layout.tsx`.

Update `src/app/layout.tsx` to replace Geist fonts with:
- **Oswald** — headings, scores, tournament names (`--font-oswald`)
- **Inter** — body text (`--font-inter`)

```tsx
import { Inter, Oswald } from "next/font/google";
```

## 7. Create Claude Code Skills

### `/frontend` skill
Path: `.claude/skills/frontend/SKILL.md`

Provides the design system context (stack, colours, fonts, shadcn component usage, layout conventions) to any future Claude session building UI. Invoke with `/frontend` before building any page or component.

### `/prd` skill
Path: `.claude/skills/prd/SKILL.md`

Manages `PRD.json` — the product requirements document used by the Ralph Loop. Incorporates "Grill Me" behaviour: when adding a new item it interviews the user with recommended answers before writing. Supports view, add (with grilling), and direct updates.

## 8. Create PRD.json
Create `PRD.json` at the repo root — the source of truth for the Ralph Loop:

```json
{
  "project": "Rackit",
  "description": "Pool Tournament App — group stage round-robin into single elimination knockout",
  "items": []
}
```

Populate using `/prd` in Claude Code.

## 9. Install Ralph Loop Plugin
Install the Ralph Loop plugin in Claude Code from the plugin registry:
https://claude.com/plugins/ralph-loop

This enables the `/ralph-loop` slash command used to action the PRD autonomously.

> See `docs/ralph-loop.md` for full usage guidance.

## 10. Push and Connect Vercel
- Commit and push to `main` (VS Code Git handles auth via Windows Credential Manager)
- Go to https://vercel.com/new → import the GitHub repo
- Vercel auto-detects Next.js — click Deploy
- Every push to `main` triggers a production deployment
- Live at: https://rackit.vercel.app/

## 11. Add Environment Variables to Vercel
Via Vercel dashboard → Project → Settings → Environment Variables. Add each variable to Production, Preview, and Development environments.

Pull them locally once added:
```bash
vercel env pull
```

This creates `.env.local` — never commit this file.

---

### `NEXTAUTH_SECRET`
A random string used by NextAuth.js to sign and encrypt session cookies and JWTs. Required in production — NextAuth will error without it.

Generate one:
```bash
openssl rand -base64 32
```
Or use https://generate-secret.vercel.app/32

---

### `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
OAuth 2.0 credentials from Google Cloud Console. Used by NextAuth.js to authenticate users via Google.

To get them:
1. Go to https://console.cloud.google.com/
2. Create a project (or select existing)
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Add authorised redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://rackit.vercel.app/api/auth/callback/google`
6. Copy the Client ID and Client Secret

---

### `NEXTAUTH_URL`
The canonical URL of your deployment. NextAuth.js uses this to build callback URLs correctly.

- Local: `http://localhost:3000`
- Production: `https://rackit.vercel.app`

On Vercel, set only the Production value — Vercel auto-injects `VERCEL_URL` for preview deployments.

---

### `MONGODB_URI`
The connection string for your MongoDB database. Used by Mongoose and the NextAuth MongoDB adapter.

Format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

To get it:
1. Go to https://cloud.mongodb.com/
2. Create a free cluster (M0)
3. Database Access → Add a database user
4. Network Access → Allow access from anywhere (`0.0.0.0/0`) for Vercel
5. Clusters → Connect → Connect your application → copy the connection string
6. Replace `<password>` with your database user's password and `<dbname>` with `rackit`
