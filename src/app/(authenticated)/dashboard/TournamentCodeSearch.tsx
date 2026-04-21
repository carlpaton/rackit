"use client";

import { useState, useTransition } from "react";
import { findTournamentByCode, TournamentSearchResult } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Users } from "lucide-react";

export function TournamentCodeSearch() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TournamentSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    if (!code.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await findTournamentByCode(code.trim());
      setResult(res);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter join code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-chalk font-mono tracking-wider"
        />
        <button
          onClick={handleSearch}
          disabled={isPending || !code.trim()}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Find Tournament
        </button>
      </div>

      {result && (
        <div>
          {"error" in result ? (
            <p className="text-sm text-loss-text">{result.error}</p>
          ) : (
            <div className="bg-surface rounded-xl p-4 shadow-md flex flex-col gap-3">
              <div className="space-y-1">
                <h3 className="text-chalk font-medium">{result.tournament.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {result.tournament.mode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Organised by {result.tournament.organizerName}
                </p>
              </div>
              <Link
                href={`/tournament/${result.tournament.id}/join`}
                className={cn(buttonVariants({ size: "sm" }), "w-full")}
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
