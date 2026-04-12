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

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`:

- **Oswald** — headings, tournament names, scores, bracket labels (`font-oswald`)
- **Inter** — body text, labels, form fields (`font-inter`, default)

Always use `font-oswald` on `h1`, `h2`, tournament titles, and score displays. Use `font-inter` (or no class) everywhere else.

## Colour Palette

Use these Tailwind custom colours (defined in `tailwind.config`). Never use raw hex values in components.

| Token | Usage | Hex |
|---|---|---|
| `bg-felt` | Page and section backgrounds | `#1a3d2b` |
| `bg-surface` | Cards, panels, modals | `#234d38` |
| `text-chalk` | Primary text | `#f0ede4` |
| `accent-gold` | CTAs, highlights, active states | `#c9a84c` |
| `result-win` | Win indicators, positive states | `#4caf72` |
| `result-loss` | Loss indicators, destructive actions | `#8b1a1a` |

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
