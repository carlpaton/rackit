"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Types } from "mongoose";

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

  await connectDB();

  await Tournament.create({
    name,
    mode,
    status: "open",
    organizerUserId: new Types.ObjectId(session.user.id),
  });

  redirect(`/dashboard`);
  return null;
}
