"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/tournament";
import Team from "@/models/team";
import User from "@/models/user";

export type TournamentSearchResult =
  | { error: string }
  | {
      tournament: {
        id: string;
        name: string;
        mode: string;
        status: string;
        organizerName: string;
      };
    };

export async function findTournamentByCode(
  code: string
): Promise<TournamentSearchResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await dbConnect();
  const tournament = await Tournament.findOne({
    joinCode: code.toLowerCase().trim(),
  }).lean();

  if (!tournament) return { error: "Invalid code." };
  if (tournament.status === "complete") return { error: "This tournament has ended." };

  const userId = session.user.id;
  const isOrganizer = tournament.organizerUserId.toString() === userId;

  const myTeam = await Team.findOne({
    tournamentId: tournament._id,
    userIds: userId,
  }).lean();

  if (isOrganizer || myTeam) {
    return { error: "You are already in this tournament." };
  }

  const organizer = await User.findById(tournament.organizerUserId).lean();
  const organizerName = organizer
    ? organizer.displayName || organizer.email.split("@")[0]
    : "Unknown";

  return {
    tournament: {
      id: tournament._id.toString(),
      name: tournament.name,
      mode: tournament.mode,
      status: tournament.status,
      organizerName,
    },
  };
}
