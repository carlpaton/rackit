"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/tournament";
import Team from "@/models/team";

async function getContext(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const existing = await Team.findOne({
    tournamentId,
    userIds: userId,
  }).lean();
  if (existing) redirect("/dashboard");

  return { userId };
}

export async function joinSingles(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await getContext(tournamentId);
  await Team.create({
    tournamentId,
    status: "full",
    userIds: [userId],
  });
  redirect(`/tournament/${tournamentId}`);
}

export async function joinHalfTeam(
  tournamentId: string,
  teamId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await getContext(tournamentId);

  const result = await Team.findOneAndUpdate(
    { _id: teamId, tournamentId, status: "open" },
    { $push: { userIds: userId }, $set: { status: "full" } },
    { new: true }
  );
  if (!result) redirect(`/tournament/${tournamentId}/join`);

  redirect(`/tournament/${tournamentId}`);
}

export async function startHalfTeam(
  tournamentId: string,
  formData: FormData
): Promise<void> {
  const { userId } = await getContext(tournamentId);
  const rawName = formData.get("teamName");
  const name =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim().slice(0, 50)
      : null;

  await Team.create({
    tournamentId,
    status: "open",
    ...(name ? { name } : {}),
    userIds: [userId],
  });
  redirect(`/tournament/${tournamentId}`);
}
