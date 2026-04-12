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

## Contributing

Rackit uses an AI-assisted contribution workflow: **author**, **branch**, then **execute**.

### Step 1 — Author the PRD

Use the `/prd` skill in Claude Code to add your feature or change to `PRD.json`. The skill will grill you with questions (with recommended answers) until it has enough detail to write a clear, well-scoped PRD item.

```bash
# Open Claude Code, then:
/prd add [describe your feature]
```

The skill handles:
- Asking clarifying questions with recommended answers
- Breaking work into appropriately sized items
- Setting dependencies between items (`dependsOn`)
- Adding deterministic steps where the implementation sequence is clear

Review `PRD.json` before moving to Step 2. Each item should be small enough to implement in a single AI context window. Split anything too large.

### Step 2 — Create a Branch

Before running Ralph, create a branch so main stays clean and deployable:

```bash
git checkout -b ralph/batch-1
```

Name the branch to reflect what's being built (e.g., `ralph/auth`, `ralph/tournament-groups`). Ralph will commit each completed PRD item to this branch. When the run is done, open a PR into main and review it there.

### Step 3 — Execute with Ralph Loop

**Pre-requisite:** Install the Ralph Loop plugin in Claude Code before first use:
https://claude.com/plugins/ralph-loop

Once installed and the PRD is ready, run the Ralph Loop inside Claude Code:

```
/ralph-loop "Work through PRD.json, implement each todo item in dependency order, commit after each, and mark done. Stop when all items are done." --max-iterations 20 --completion-promise "COMPLETE"
```

Ralph picks up each `todo` item in dependency order, implements it, commits, and marks it `done`. It does **not** pause between items for human approval — it moves straight to the next task automatically.

Two ways to run it:

- **Supervised** — watch each iteration and cancel with `/cancel-ralph` before the next task starts if something looks wrong. Recommended until you trust your PRD quality.
- **AFK** — walk away and come back to finished code. Risk: if an early item is wrong, Ralph builds subsequent items on top of the bug.

**Always review the git commits when Ralph finishes** — each completed item is a separate commit. Review the diff, test it locally, and approve or rework before merging. Running Ralph on a feature branch and reviewing it as a PR is the safest approach.

> See `docs/ralph-loop.md` for full documentation including cost guidance, dependency handling, and when not to use Ralph.

---

## Further Reading

- `CLAUDE.md` — project brief, tournament rules, and coding conventions for AI agents
- `docs/steps.md` — full setup playbook for replicating this project from scratch
- `docs/ralph-loop.md` — how the Ralph Loop works and when to use it
