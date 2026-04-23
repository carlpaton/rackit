"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/tournament";

export type CreateTournamentState = { error?: string } | null;

async function generateJoinCode(): Promise<string> {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (let len = 4; len <= 8; len++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = "";
      for (let i = 0; i < len; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await Tournament.findOne({ joinCode: code });
      if (!existing) return code;
    }
  }
  throw new Error("Failed to generate unique join code");
}

export async function createTournament(
  _prev: CreateTournamentState,
  formData: FormData
): Promise<CreateTournamentState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const mode = formData.get("mode") as string;
  const visibility = formData.get("visibility") as string;

  if (!name) return { error: "Tournament name is required." };
  if (mode !== "singles" && mode !== "doubles") {
    return { error: "Please select a mode." };
  }

  const isPublic = visibility !== "private";
  await dbConnect();
  const joinCode = await generateJoinCode();

  await Tournament.create({
    name,
    mode,
    isPublic,
    joinCode,
    organizerUserId: session.user.id,
  });

  redirect(`/dashboard`);
  return null;
}
