---
name: frontend
description: Use when building any UI component, page, or layout for Rackit. Provides the design system, component library, colour palette, typography, and conventions to ensure a consistent pool tournament themed experience.
allowed-tools: Read Glob Grep
---

You are building UI for **Rackit**, a pool tournament app. Follow these design system rules for every component, page, or layout you create.

## Stack

- **Next.js 16** — App Router only, files live under `src/app/`
- **React 19** — use Server Components by default, Client Components only when interactivity is required (`"use client"`)
- **Tailwind CSS** — utility-first, no inline styles
- **shadcn/ui** — use existing shadcn components before writing custom ones. Check `src/components/ui/` for what is already installed before adding new ones

## Typography

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` and registered in `globals.css` as:

- `--font-heading` → Oswald — use class `font-heading`
- `--font-sans` → Inter — use class `font-sans` (applied by default to `body`)

`globals.css` globally applies `font-heading` to `h1`, `h2`, `h3`, `h4` — no extra class needed on those elements.

Use `font-heading` explicitly only on non-heading elements that need Oswald (e.g. score badges, step numbers, bracket labels).

**Never use `font-oswald` or `font-inter`** — those CSS variables exist but are not registered as Tailwind utilities. Only `font-heading` and `font-sans` work.

## Colour Palette

All tokens are defined in `src/app/globals.css` under `@theme inline`. Config is **not** in `tailwind.config.js` — this project uses Tailwind v4. Never use raw hex values.

The Tailwind utility prefix matches the CSS variable name exactly (e.g. `--color-gold` → `text-gold`, `bg-gold`, `border-gold`):

| CSS variable | Tailwind utilities | Usage | Hex |
|---|---|---|---|
| `--color-felt` | `bg-felt`, `text-felt` | Page/section backgrounds | `#1a3d2b` |
| `--color-surface` | `bg-surface`, `text-surface` | Cards, panels, modals | `#234d38` |
| `--color-chalk` | `text-chalk` | Primary text | `#f0ede4` |
| `--color-gold` | `text-gold`, `bg-gold`, `border-gold` | CTAs, highlights, active states | `#c9a84c` |
| `--color-win` | `text-win`, `bg-win` | Win indicators, positive states | `#4caf72` |
| `--color-loss` | `text-loss`, `bg-loss` | Loss backgrounds, destructive fills | `#8b1a1a` |
| `--color-loss-text` | `text-loss-text` | Loss text/icons on dark green (readable red) | `#e05555` |

Dark theme only — there is no light/dark toggle.

## Components

Use **shadcn/ui** components as the base. Common mappings:
- Buttons → `<Button>` with `variant="default"` (gold accent) or `variant="destructive"` (loss red)
- Forms → `<Form>`, `<Input>`, `<Label>` from shadcn
- Tables (brackets, standings) → `<Table>` from shadcn
- Dialogs / confirmations → `<Dialog>` from shadcn
- Toasts / feedback → `<Sonner>` (shadcn toast)

## Icons

Use **Lucide React** (bundled with shadcn/ui). Import directly:
```tsx
import { Trophy, Users, Table2 } from "lucide-react"
```

## Layout Conventions

- Wrap all pages in the shared layout — do not create one-off wrappers
- Max content width: `max-w-5xl mx-auto px-4`
- Section spacing: `py-8` or `py-12`
- Cards use `bg-surface rounded-xl p-6 shadow-md`

## Do / Don't

- **Do** use Server Components for data fetching and static content
- **Do** co-locate page-specific components in the same `app/` route folder
- **Don't** use `"use client"` unless the component needs state, effects, or browser events
- **Don't** create a new shadcn component if one already exists in `src/components/ui/`
- **Don't** use arbitrary Tailwind colours — always use the palette tokens above
- **Don't** create a `tailwind.config.js` — this project uses Tailwind v4, all config is in `src/app/globals.css`
