# Rackit

A Pool Tournament App. Create and manage tournaments with group stage round-robin and single elimination knockout. Built with Next.js 16, MongoDB Atlas, Mongoose, and NextAuth.js.

Live: https://rackit.vercel.app

---

## Getting Started

### 1. Create a MongoDB Atlas cluster

Go to [cloud.mongodb.com](https://cloud.mongodb.com), create a free cluster, then grab the connection string from **Database → Connect → Drivers**.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | Atlas connection string (`mongodb+srv://...`) |
| `NEXTAUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |

### 3. Install dependencies

```bash
npm install
```

No migration step needed — Mongoose creates collections automatically on first use.

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
