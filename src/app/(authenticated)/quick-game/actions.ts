"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function generateQuickGameJoinCode(): Promise<string> {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (let len = 4; len <= 8; len++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = "";
      for (let i = 0; i < len; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await prisma.quickGame.findUnique({ where: { joinCode: code } });
      if (!existing) return code;
    }
  }
  throw new Error("Failed to generate unique join code");
}

export type QuickGameActionResult = { error?: string } | null;

export async function createQuickGame(): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const joinCode = await generateQuickGameJoinCode();
  await prisma.quickGame.create({
    data: { joinCode, creatorId: session.user.id },
  });

  revalidatePath("/dashboard");
  return null;
}

export async function joinQuickGame(code: string): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const game = await prisma.quickGame.findUnique({
    where: { joinCode: code.toLowerCase().trim() },
  });

  if (!game) return { error: "Invalid code." };
  if (game.creatorId === session.user.id) return { error: "You cannot join your own game." };
  if (game.status !== "waiting") return { error: "This game is no longer available." };

  await prisma.quickGame.update({
    where: { id: game.id },
    data: { opponentId: session.user.id, status: "active" },
  });

  revalidatePath("/dashboard");
  return null;
}

export async function cancelQuickGame(gameId: string): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const game = await prisma.quickGame.findUnique({ where: { id: gameId } });
  if (!game) return { error: "Game not found." };
  if (game.creatorId !== session.user.id) return { error: "Not authorized." };
  if (game.status !== "waiting") return { error: "Cannot cancel an active game." };

  await prisma.quickGame.delete({ where: { id: gameId } });

  revalidatePath("/dashboard");
  return null;
}

export async function recordQuickGameResult(
  gameId: string,
  winnerId: string
): Promise<QuickGameActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const game = await prisma.quickGame.findUnique({ where: { id: gameId } });
  if (!game) return { error: "Game not found." };
  if (game.status !== "active") return { error: "Game is not active." };

  const userId = session.user.id;
  if (game.creatorId !== userId && game.opponentId !== userId) {
    return { error: "Not authorized." };
  }
  if (winnerId !== game.creatorId && winnerId !== game.opponentId) {
    return { error: "Invalid winner." };
  }

  await prisma.quickGame.update({
    where: { id: gameId },
    data: { winnerId, status: "complete" },
  });

  revalidatePath("/dashboard");
  return null;
}
