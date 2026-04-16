"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Team } from "@/models/team";
import { Types } from "mongoose";

async function getContext(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const tId = new Types.ObjectId(tournamentId);

  const tournament = await Tournament.findById(tId).lean();
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const existing = await Team.findOne({ tournamentId: tId, userIds: userId }).lean();
  if (existing) redirect("/dashboard");

  return { userId, tId };
}

export async function joinSingles(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const { userId, tId } = await getContext(tournamentId);
  await Team.create({ tournamentId: tId, userIds: [userId], status: "full" });
  redirect(`/tournament/${tournamentId}`);
}

export async function joinHalfTeam(
  tournamentId: string,
  teamId: string,
  _formData: FormData
): Promise<void> {
  const { userId, tId } = await getContext(tournamentId);
  const team = await Team.findOneAndUpdate(
    { _id: new Types.ObjectId(teamId), tournamentId: tId, status: "open" },
    { $push: { userIds: userId }, $set: { status: "full" } },
    { new: true }
  );
  if (!team) redirect(`/tournament/${tournamentId}/join`);
  redirect(`/tournament/${tournamentId}`);
}

export async function startHalfTeam(
  tournamentId: string,
  formData: FormData
): Promise<void> {
  const { userId, tId } = await getContext(tournamentId);
  const rawName = formData.get("teamName");
  const name = typeof rawName === "string" ? rawName.trim().slice(0, 50) : undefined;
  await Team.create({
    tournamentId: tId,
    userIds: [userId],
    status: "open",
    ...(name ? { name } : {}),
  });
  redirect(`/tournament/${tournamentId}`);
}
