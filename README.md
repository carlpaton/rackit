# Rackit

A Pool Tournament App. Create and manage tournaments with group stage round-robin and single elimination knockout. Built with Next.js 16, Supabase PostgreSQL, Prisma, and NextAuth.js.

Live: https://rackit.vercel.app

---

## Getting Started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then grab two connection strings from **Project Settings → Database → Connection string**:

- **Transaction pooler** (port 6543) → `DATABASE_URL`
- **Direct connection** (port 5432) → `DIRECT_URL`

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 3. Install dependencies and create the database schema

```bash
npm install
npx prisma migrate dev --name init
```

`prisma migrate dev` creates the migration files and applies the schema to your Supabase database. The generated `prisma/migrations/` folder is committed so Vercel can replay migrations on deploy.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Check Running Instances

```bash
# Check what's listening on port 3000
netstat -ano | grep :3000

# List all Node processes
ps aux | grep node

# Kill by PID (replace 12345 with actual PID from above)
kill 12345
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

---

## Further Reading

- `CLAUDE.md` — project brief, tournament rules, and coding conventions for AI agents
- `docs/steps.md` — full setup playbook for replicating this project from scratch
- `docs/ralph-loop.md` — how the Ralph Loop works and when to use it
