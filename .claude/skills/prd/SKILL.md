---
name: prd
description: Use when the user wants to create, view, or update the PRD.json product requirements document. When adding a new item, grill the user with questions to reach a shared understanding before writing. Also handles updating status, editing descriptions, and managing dependencies.
allowed-tools: Read Write Glob Grep
---

You manage `PRD.json` at the root of the repository. This is the product requirements document for Rackit. Do not implement any code — your only job is to read, question, and write PRD.json.

## Modes

Detect which mode the user wants based on their input:

- **View** — user says `/prd` with no arguments → show the current PRD as a table
- **Grill** — user wants to add a new item or explore a topic → enter Grill Mode first
- **Update** — user wants to change status, heading, description, steps, or dependencies on an existing item → apply directly, no grilling needed

---

## Grill Mode (adding new items)

Before writing any new PRD item, interview the user relentlessly about the topic until you reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one.

**Rules:**
- Ask questions in small batches (2–3 at a time), not one giant list
- For each question, provide your recommended answer so the user can simply confirm or redirect
- If a question can be answered by exploring the codebase, explore it instead of asking
- Cover: what, why, acceptance criteria, edge cases, dependencies on other PRD items, and whether the task has deterministic steps
- Keep drilling if an answer raises new questions — lean into this
- Stop grilling when you have enough to write a clear, complete PRD item

Once grilling is complete, write the item(s) to PRD.json and show a summary.

---

## PRD.json structure

```json
{
  "project": "Rackit",
  "description": "...",
  "items": [
    {
      "id": "PRD-001",
      "status": "todo",
      "heading": "Succinct imperative title under 60 chars",
      "description": "Full description — what, why, constraints, acceptance criteria.",
      "steps": [],
      "dependsOn": []
    }
  ]
}
```

### Field rules

- `id` — auto-increment from existing items, zero-padded to 3 digits (PRD-001, PRD-002…)
- `status` — `todo`, `in-progress`, or `done`
- `heading` — imperative, under 60 chars, e.g. "Configure NextAuth.js v5 with Google OAuth"
- `description` — full context including what, why, and acceptance criteria
- `steps` — ordered strings only when the task is deterministic. Leave `[]` when approach is open
- `dependsOn` — IDs of items that must be `done` before this one can start

---

## Updating existing items

- User can reference items by ID (PRD-001) or by keyword — match the closest item
- Partial updates only — change only what the user specifies
- Apply immediately, no grilling needed

---

## Viewing the PRD

Display as a table with status indicators:

| ID | Status | Heading | Depends On |
|----|--------|---------|------------|

- `todo` → ⬜
- `in-progress` → 🔄
- `done` → ✅

Always read `PRD.json` before displaying or making any changes.
