"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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

  const tournament = await prisma.tournament.findUnique({
    where: { joinCode: code.toLowerCase().trim() },
    include: { organizer: { select: { displayName: true, email: true } } },
  });

  if (!tournament) return { error: "Invalid code." };
  if (tournament.status === "complete") return { error: "This tournament has ended." };

  const userId = session.user.id;
  const isOrganizer = tournament.organizerUserId === userId;

  const myTeam = await prisma.userTeam.findFirst({
    where: { userId, team: { tournamentId: tournament.id } },
  });

  if (isOrganizer || myTeam) {
    return { error: "You are already in this tournament." };
  }

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      mode: tournament.mode,
      status: tournament.status,
      organizerName:
        tournament.organizer.displayName ||
        tournament.organizer.email.split("@")[0],
    },
  };
}
