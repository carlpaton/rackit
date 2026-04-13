---
name: pr-description
description: Generate a pull request description from PRD.json items. Asks which PRD items are included in the PR, then produces a formatted PR description with a summary per item and a test plan.
allowed-tools: Read Bash(git log:*) Bash(git diff:*) Bash(git branch:*)
---

Read `PRD.json` and the current git branch/log to generate a pull request description.

## Steps

1. **Read PRD.json** to get all items and their headings/descriptions.

2. **Ask the user which PRD items are included in this PR.** Show a numbered list of all items with their ID, status, and heading so the user can pick easily. Accept a list of IDs (e.g. "PRD-001, PRD-002") or "all done" to include all `done` items.

3. **Run `git log main..HEAD --oneline`** to see the commits on this branch.

4. **Generate the PR description** in this exact format:

```
## Summary

{One sentence describing the overall change.}

{For each selected PRD item, one bullet:}
- **{PRD-ID} — {heading}**: {one sentence describing what was done}

## PRD items

{For each selected PRD item, a sub-section:}
### {PRD-ID} — {heading}
{2–3 sentences from the item's description covering what it does and its acceptance criteria.}

## Test plan

- [ ] {Actionable test step derived from each PRD item's acceptance criteria}
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Rules

- Do not invent requirements — pull all content from PRD.json descriptions and acceptance criteria
- Keep bullet points to one sentence each
- The test plan must have at least one checkbox per PRD item plus the build check
- Output only the PR description block — no preamble, no explanation
