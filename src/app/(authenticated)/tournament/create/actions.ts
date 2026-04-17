"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type CreateTournamentState = { error?: string } | null;

export async function createTournament(
  _prev: CreateTournamentState,
  formData: FormData
): Promise<CreateTournamentState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const mode = formData.get("mode") as string;

  if (!name) return { error: "Tournament name is required." };
  if (mode !== "singles" && mode !== "doubles") {
    return { error: "Please select a mode." };
  }

  await prisma.tournament.create({
    data: {
      name,
      mode,
      organizerUserId: session.user.id,
    },
  });

  redirect(`/dashboard`);
  return null;
}
