"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import QuickGame from "@/models/quick-game";

async function generateQuickGameJoinCode(): Promise<string> {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (let len = 4; len <= 8; len++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = "";
      for (let i = 0; i < len; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await QuickGame.findOne({ joinCode: code });
      if (!existing) return code;
    }
  }
  throw new Error("Failed to generate unique join code");
}

export type QuickGameActionResult = { error?: string } | null;

export async function createQuickGame(): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await dbConnect();
  const joinCode = await generateQuickGameJoinCode();
  await QuickGame.create({ joinCode, creatorId: session.user.id });

  revalidatePath("/dashboard");
  return null;
}

export async function joinQuickGame(code: string): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await dbConnect();
  const game = await QuickGame.findOne({ joinCode: code.toLowerCase().trim() }).lean();

  if (!game) return { error: "Invalid code." };
  if (game.creatorId.toString() === session.user.id)
    return { error: "You cannot join your own game." };
  if (game.status !== "waiting") return { error: "This game is no longer available." };

  await QuickGame.findByIdAndUpdate(game._id, {
    opponentId: session.user.id,
    status: "active",
  });

  revalidatePath("/dashboard");
  return null;
}

export async function cancelQuickGame(gameId: string): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await dbConnect();
  const game = await QuickGame.findById(gameId).lean();
  if (!game) return { error: "Game not found." };
  if (game.creatorId.toString() !== session.user.id) return { error: "Not authorized." };
  if (game.status !== "waiting") return { error: "Cannot cancel an active game." };

  await QuickGame.findByIdAndDelete(gameId);

  revalidatePath("/dashboard");
  return null;
}

export async function recordQuickGameResult(
  gameId: string,
  winnerId: string
): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await dbConnect();
  const game = await QuickGame.findById(gameId).lean();
  if (!game) return { error: "Game not found." };
  if (game.status !== "active") return { error: "Game is not active." };

  const userId = session.user.id;
  const creatorId = game.creatorId.toString();
  const opponentId = game.opponentId?.toString() ?? null;

  if (creatorId !== userId && opponentId !== userId) {
    return { error: "Not authorized." };
  }
  if (winnerId !== creatorId && winnerId !== opponentId) {
    return { error: "Invalid winner." };
  }

  await QuickGame.findByIdAndUpdate(gameId, { winnerId, status: "complete" });

  revalidatePath("/dashboard");
  revalidatePath("/rankings");
  return null;
}
