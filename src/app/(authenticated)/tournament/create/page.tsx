"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTournament } from "./actions";
import { Button } from "@/components/ui/button";

export default function CreateTournamentPage() {
  const [state, action, pending] = useActionState(createTournament, null);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-chalk">Create Tournament</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up a new public tournament. You&apos;ll be the organizer.
          </p>
        </div>

        <form action={action} className="bg-surface rounded-xl p-6 shadow-md space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-chalk">
              Tournament name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Friday Night Knockouts"
              className="w-full rounded-md border border-white/10 bg-felt px-3 py-2 text-sm text-chalk placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-chalk">Mode</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="singles"
                  required
                  className="accent-gold"
                />
                <span className="text-sm text-chalk">Singles</span>
                <span className="text-xs text-muted-foreground">(1 player per team)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="doubles"
                  className="accent-gold"
                />
                <span className="text-sm text-chalk">Doubles</span>
                <span className="text-xs text-muted-foreground">(2 players per team)</span>
              </label>
            </div>
          </fieldset>

          {state?.error && (
            <p className="text-sm text-loss">{state.error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Creating…" : "Create Tournament"}
            </Button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-chalk hover:border-white/20 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
