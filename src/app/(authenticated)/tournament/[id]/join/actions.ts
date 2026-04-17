"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

async function getContext(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const existing = await prisma.userTeam.findFirst({
    where: { userId, team: { tournamentId } },
  });
  if (existing) redirect("/dashboard");

  return { userId };
}

export async function joinSingles(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await getContext(tournamentId);
  await prisma.team.create({
    data: {
      tournamentId,
      status: "full",
      users: { create: { userId } },
    },
  });
  redirect(`/tournament/${tournamentId}`);
}

export async function joinHalfTeam(
  tournamentId: string,
  teamId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await getContext(tournamentId);

  try {
    await prisma.$transaction(async (tx) => {
      const result = await tx.team.updateMany({
        where: { id: teamId, tournamentId, status: "open" },
        data: { status: "full" },
      });
      if (result.count === 0) throw new Error("team_not_found");
      await tx.userTeam.create({ data: { userId, teamId } });
    });
  } catch {
    redirect(`/tournament/${tournamentId}/join`);
  }

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

  await prisma.team.create({
    data: {
      tournamentId,
      status: "open",
      ...(name ? { name } : {}),
      users: { create: { userId } },
    },
  });
  redirect(`/tournament/${tournamentId}`);
}
