"use client";

import { useState, useTransition } from "react";
import {
  createQuickGame,
  joinQuickGame,
  cancelQuickGame,
  recordQuickGameResult,
} from "../quick-game/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickGameData = {
  id: string;
  joinCode: string;
  status: string;
  creatorId: string;
  creatorName: string;
  opponentId: string | null;
  opponentName: string | null;
  winnerId: string | null;
};

type Props = {
  userId: string;
  quickGames: QuickGameData[];
};

export function QuickGameSection({ userId, quickGames }: Props) {
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const waitingGame = quickGames.find((g) => g.status === "waiting");
  const activeGames = quickGames.filter((g) => g.status === "active");

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createQuickGame();
      if (result?.error) setError(result.error);
    });
  }

  function handleJoin() {
    if (!joinCodeInput.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await joinQuickGame(joinCodeInput.trim());
      if (result?.error) setError(result.error);
      else setJoinCodeInput("");
    });
  }

  function handleCancel(gameId: string) {
    startTransition(async () => {
      await cancelQuickGame(gameId);
    });
  }

  function handleRecord(gameId: string, winnerId: string) {
    startTransition(async () => {
      await recordQuickGameResult(gameId, winnerId);
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
        Quick Games
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!waitingGame && (
          <div className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4">
            {error && <p className="text-sm text-loss-text">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={isPending}
              className={cn(buttonVariants(), "w-full")}
            >
              Create New Game
            </button>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Or join with a code:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-chalk font-mono tracking-wider"
                />
                <button
                  onClick={handleJoin}
                  disabled={isPending || !joinCodeInput.trim()}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {waitingGame && (
          <div className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Waiting for opponent…</p>
              <button
                onClick={() => handleCancel(waitingGame.id)}
                disabled={isPending}
                className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              >
                Cancel
              </button>
            </div>
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-2">Share this code</p>
              <p className="text-4xl font-mono font-bold text-gold tracking-widest">
                {waitingGame.joinCode.toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {activeGames.map((game) => {
          const opponentId =
            game.creatorId === userId ? game.opponentId : game.creatorId;
          const opponentName =
            game.creatorId === userId ? game.opponentName : game.creatorName;
          return (
            <div
              key={game.id}
              className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quick Game vs</p>
                <p className="text-chalk font-medium">{opponentName}</p>
                <p className="text-xs text-gold">Active</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Who won?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecord(game.id, userId)}
                    disabled={isPending}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1"
                    )}
                  >
                    Me
                  </button>
                  <button
                    onClick={() => handleRecord(game.id, opponentId!)}
                    disabled={isPending}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1"
                    )}
                  >
                    {opponentName}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
