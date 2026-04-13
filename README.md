# Rackit

A Pool Tournament App. Create and manage tournaments with group stage round-robin and single elimination knockout. Built with Next.js 16, MongoDB, and NextAuth.js.

Live: https://rackit.vercel.app

---

## Getting Started

Install dependencies and run the development server:

```bash
npm install
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
