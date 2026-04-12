# Ralph Loop

Ralph is an autonomous AI agent loop that repeatedly runs Claude Code against a PRD until every item is complete. Named after Ralph Wiggum from The Simpsons — relentlessly persistent.

## How It Works

1. Reads `PRD.json`, finds the next `todo` item with no unmet dependencies
2. Implements it
3. Marks it `done` in `PRD.json`
4. Commits via git
5. Loops — each iteration starts with fresh context
6. Exits when all items are `done`

Memory persists between iterations via git history and `PRD.json` — not the conversation context.

## PRD Item Sizing

Each item must be **small enough to complete in one context window**. If a task is too large, Ralph runs out of context and produces poor code. Good rule of thumb: if you can't describe it in 2–3 sentences, split it.

Use `dependsOn` to sequence items — Ralph automatically skips items whose dependencies aren't `done` yet.

## Workflow

```
/prd          ← HUMAN: author and refine PRD.json (grill mode)
   ↓
Ralph Loop    ← RALPH: implements autonomously, one item per iteration
   ↓
Review        ← HUMAN: review git commits, test, approve or rework
```

## When Is the Human in the Loop?

### Before — PRD Authoring (most important)
Use `/prd` to define what gets built. You drive this entirely — the feature scope, acceptance criteria, steps, and sequencing. The quality of this step determines the quality of Ralph's output. A vague PRD item produces vague code. A well-grilled item gives Ralph exactly what it needs.

### During — Optional Supervision
Ralph runs autonomously and does **not** pause between items for human approval. It marks each item `done` itself and immediately moves to the next. The `dependsOn` field controls sequencing between tasks but does not wait for you — it only means "don't start this until the previous item is marked done in PRD.json".

You can intervene at any point with `/cancel-ralph`. Two styles:

- **Supervised** — watch each iteration complete one task. Cancel before the next starts if something looks wrong. This is the closest to human-in-the-loop between items.
- **AFK** — walk away, come back to finished code. Only practical when you have high confidence in the PRD quality.

Start supervised until you trust your PRD quality. The risk of AFK mode is that if an early item is implemented incorrectly, Ralph builds subsequent items on top of that bug.

### After — Review Commits (quality gate)
Each completed PRD item produces a git commit. Review the diff, run it locally, and decide whether to keep it or rework it. This is your quality gate before anything is merged or deployed. Ralph is prolific — do not skip this step.

**Mitigations for cascading failures:**
- **Low `--max-iterations`** — run 3–5 items at a time, review commits, then continue
- **Feature branch** — run Ralph on a branch and review it as a PR before merging to main
- **Small PRD items** — the more deterministic each item, the less a bad one cascades into the next

## Installation

Ralph Loop is an official Anthropic plugin for Claude Code. Install it from the plugin registry:
https://claude.com/plugins/ralph-loop

## Running It

Inside Claude Code, use the `/ralph-loop` slash command:

```
/ralph-loop "Work through PRD.json, implement each todo item in dependency order, commit after each, and mark done. Stop when all items are done." --max-iterations 20 --completion-promise "COMPLETE"
```

The plugin intercepts Claude's normal exit via a stop hook and re-injects the prompt automatically each iteration.

To cancel a running loop early:
```
/cancel-ralph
```

Ralph exits cleanly when it outputs your `--completion-promise` string or hits `--max-iterations`.

## Cost Warning

Each iteration consumes tokens. A long run (50+ iterations on a large codebase) can cost **$50–100+** in API credits, or burn through a Claude subscription limit faster than expected. Set `--max-iterations` conservatively and monitor usage, especially for overnight runs.

## Best Use Cases

Ralph works best for tasks with **machine-verifiable outcomes**:
- Boilerplate and scaffolding
- CRUD endpoints
- Auth setup
- Database models
- Anything with clear pass/fail criteria (tests, build succeeds)

Avoid Ralph for tasks requiring human judgement — UX decisions, copy, component API design. It will mark the checkbox and move on, confidently wrong.

## Tips

- Keep PRD items small and deterministic
- Populate `steps` in PRD items when the implementation sequence is clear — Ralph follows them
- Use `dependsOn` to enforce correct build order
- Review git commits after each run — each iteration should produce a clean, reviewable commit
- Do not clear conversation context mid-run — Ralph references prior iterations
