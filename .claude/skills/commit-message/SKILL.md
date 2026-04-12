---
name: commit-message
description: Generate a succinct one-line commit message based on uncommitted changes. Use when the user wants a commit message, asks what to call their commit, or wants to commit their work.
allowed-tools: Bash(git diff:*) Bash(git status:*)
---

Run `git status` and `git diff` to understand what has changed, then output a single commit message.

Rules:
- One line only, under 72 characters
- Imperative mood — "Add", "Fix", "Update", "Remove" not "Added" or "Adds"
- Specific — describe what changed, not that something changed
- No period at the end
- Do not explain or justify — just output the commit message

Output only the commit message, nothing else.
