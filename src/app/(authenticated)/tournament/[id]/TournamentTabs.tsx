"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "roster" | "groups" | "bracket";

interface Props {
  defaultTab: Tab;
  bracketLocked: boolean;
  rosterContent: React.ReactNode;
  groupsContent: React.ReactNode;
  bracketContent: React.ReactNode;
  showGroups: boolean;
}

export function TournamentTabs({
  defaultTab,
  bracketLocked,
  rosterContent,
  groupsContent,
  bracketContent,
  showGroups,
}: Props) {
  const [active, setActive] = useState<Tab>(defaultTab);

  const visibleTabs = [
    { key: "roster" as Tab, label: "Teams", show: true },
    { key: "groups" as Tab, label: "Groups", show: showGroups },
    { key: "bracket" as Tab, label: "Bracket", show: true, locked: bracketLocked },
  ].filter((t) => t.show);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-white/10">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.locked && setActive(tab.key)}
            disabled={tab.locked}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              active === tab.key
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-chalk",
              tab.locked && "opacity-40 cursor-not-allowed hover:text-muted-foreground"
            )}
          >
            {tab.label}
            {tab.locked && " 🔒"}
          </button>
        ))}
      </div>

      {active === "roster"
        ? rosterContent
        : active === "groups"
          ? groupsContent
          : bracketContent}
    </div>
  );
}
