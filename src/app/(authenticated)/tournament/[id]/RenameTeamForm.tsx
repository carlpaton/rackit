"use client";

import { useState, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";
import { renameTeam } from "./actions";

export function RenameTeamForm({
  teamId,
  tournamentId,
  currentName,
  displayLabel,
}: {
  teamId: string;
  tournamentId: string;
  currentName: string;
  displayLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boundAction = renameTeam.bind(null, teamId, tournamentId);

  function startEdit() {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancel() {
    setEditing(false);
  }

  if (!editing) {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="truncate">{displayLabel}</span>
        <button
          type="button"
          onClick={startEdit}
          className="text-muted-foreground hover:text-chalk transition-colors shrink-0"
          title="Rename team"
        >
          <Pencil className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <form action={boundAction} className="flex items-center gap-2 flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        name="teamName"
        defaultValue={currentName}
        maxLength={50}
        placeholder="Team name (optional)"
        className="flex-1 min-w-0 bg-background border border-white/20 rounded px-2 py-0.5 text-sm text-chalk placeholder:text-muted-foreground focus:outline-none focus:border-white/40"
      />
      <button
        type="submit"
        className="text-win hover:text-win/80 transition-colors shrink-0"
        title="Save"
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={cancel}
        className="text-muted-foreground hover:text-chalk transition-colors shrink-0"
        title="Cancel"
      >
        <X className="size-4" />
      </button>
    </form>
  );
}
