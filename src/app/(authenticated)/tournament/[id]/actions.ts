"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function leaveTournament(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const userTeam = await prisma.userTeam.findFirst({
    where: { userId, team: { tournamentId } },
    include: { team: { include: { users: true } } },
  });
  if (!userTeam) redirect("/dashboard");

  const team = userTeam.team;

  if (team.status === "full" && team.users.length === 2) {
    await prisma.$transaction([
      prisma.userTeam.delete({
        where: { userId_teamId: { userId, teamId: team.id } },
      }),
      prisma.team.update({ where: { id: team.id }, data: { status: "open" } }),
    ]);
  } else {
    // Deletes the team; UserTeam rows cascade-delete
    await prisma.team.delete({ where: { id: team.id } });
  }

  redirect("/dashboard");
}

export async function startTournament(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId !== userId) redirect("/dashboard");
  if (tournament.status !== "open") redirect("/dashboard");

  const fullTeams = await prisma.team.findMany({
    where: { tournamentId, status: "full" },
  });
  if (fullTeams.length < 2) redirect(`/tournament/${tournamentId}`);

  const path = fullTeams.length <= 4 ? "direct_knockout" : "group_stage";

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "in_progress", path },
  });

  if (path === "group_stage") {
    await generateGroupStage(tournamentId, fullTeams.map((t) => t.id));
  } else {
    await generateKnockoutBracket(tournamentId, fullTeams.map((t) => t.id));
  }

  redirect(`/tournament/${tournamentId}`);
}

async function generateGroupStage(tournamentId: string, fullTeamIds: string[]) {
  const teamIds = shuffle(fullTeamIds);
  const n = teamIds.length;
  const numGroups = Math.max(2, Math.ceil(n / 4));
  const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let g = 0; g < numGroups; g++) {
    const start = Math.floor((g * n) / numGroups);
    const end = Math.floor(((g + 1) * n) / numGroups);
    const groupTeamIds = teamIds.slice(start, end);

    const group = await prisma.group.create({
      data: {
        tournamentId,
        name: `Group ${groupLetters[g]}`,
        teams: {
          create: groupTeamIds.map((teamId) => ({ teamId })),
        },
      },
    });

    const matchData = [];
    for (let i = 0; i < groupTeamIds.length; i++) {
      for (let j = i + 1; j < groupTeamIds.length; j++) {
        matchData.push({
          tournamentId,
          groupId: group.id,
          teamAId: groupTeamIds[i],
          teamBId: groupTeamIds[j],
          phase: "group" as const,
        });
      }
    }
    if (matchData.length > 0) {
      await prisma.match.createMany({ data: matchData });
    }
  }
}

export async function recordResult(
  matchId: string,
  winnerId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { delegations: true },
  });
  if (!match) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
  });
  if (!tournament || tournament.status !== "in_progress") redirect("/dashboard");

  const isOrganizer = tournament.organizerUserId === userId;
  if (!isOrganizer) {
    const userTeam = await prisma.userTeam.findFirst({
      where: { userId, team: { tournamentId: match.tournamentId } },
    });
    const isDelegated = userTeam
      ? match.delegations.some((d) => d.teamId === userTeam.teamId)
      : false;
    if (!isDelegated) redirect(`/tournament/${match.tournamentId}`);
  }

  if (match.winnerId !== null) redirect(`/tournament/${match.tournamentId}`);

  const validTeamIds = [match.teamAId, ...(match.teamBId ? [match.teamBId] : [])];
  if (!validTeamIds.includes(winnerId)) redirect(`/tournament/${match.tournamentId}`);

  await prisma.match.update({
    where: { id: matchId },
    data: { winnerId },
  });

  if (match.phase === "knockout") {
    await advanceKnockout(match.tournamentId, matchId, winnerId);
  }

  redirect(`/tournament/${match.tournamentId}`);
}

async function advanceKnockout(
  tournamentId: string,
  completedMatchId: string,
  winnerId: string
) {
  const allKnockout = await prisma.match.findMany({
    where: { tournamentId, phase: "knockout" },
    orderBy: [{ bracketOrder: "asc" }, { createdAt: "asc" }],
  });

  const rounds = ["QF", "SF", "Final"];
  const completedMatch = allKnockout.find((m) => m.id === completedMatchId);
  if (!completedMatch) return;

  const currentRoundIdx = rounds.indexOf(completedMatch.round ?? "");
  if (currentRoundIdx === -1 || currentRoundIdx === rounds.length - 1) {
    if (completedMatch.round === "Final") {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "complete", winnerTeamId: winnerId },
      });
    }
    return;
  }

  const nextRound = rounds[currentRoundIdx + 1] as "QF" | "SF" | "Final";
  const currentRoundMatches = allKnockout.filter(
    (m) => m.round === completedMatch.round
  );
  const matchIndex = currentRoundMatches.findIndex(
    (m) => m.id === completedMatchId
  );
  const pairIndex = Math.floor(matchIndex / 2);
  const pair = currentRoundMatches.slice(pairIndex * 2, pairIndex * 2 + 2);

  const getWinner = (m: { id: string; winnerId: string | null }) =>
    m.id === completedMatchId ? winnerId : m.winnerId;

  const pairCompleted = pair.filter(
    (m) => m.winnerId !== null || m.id === completedMatchId
  );

  if (pairCompleted.length === 2) {
    const winnerA = getWinner(pair[0]);
    const winnerB = pair[1] ? getWinner(pair[1]) : null;
    const nextBracketOrder =
      (currentRoundMatches
        .filter((_, i) => i < pairIndex * 2)
        .filter((_, i) => i % 2 === 0).length) +
      (allKnockout.filter((m) => m.round === nextRound).length);
    await prisma.match.create({
      data: {
        tournamentId,
        teamAId: winnerA!,
        teamBId: winnerB,
        phase: "knockout",
        round: nextRound,
        bracketOrder: nextBracketOrder,
      },
    });
  }
}

export async function advanceToKnockout(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId !== userId) redirect("/dashboard");
  if (tournament.status !== "in_progress" || tournament.path !== "group_stage")
    redirect(`/tournament/${tournamentId}`);

  const groupMatches = await prisma.match.findMany({
    where: { tournamentId, phase: "group" },
  });
  const allPlayed = groupMatches.every((m) => m.winnerId !== null);
  if (!allPlayed) redirect(`/tournament/${tournamentId}`);

  const groups = await prisma.group.findMany({
    where: { tournamentId },
    include: { teams: true },
  });
  const qualifiers: string[] = [];

  for (const group of groups) {
    const gMatches = groupMatches.filter((m) => m.groupId === group.id);
    const standings = computeGroupStandings(
      group.teams.map((gt) => gt.teamId),
      gMatches
    );
    qualifiers.push(...standings.slice(0, 2).map((s) => s.teamId));
  }

  await generateKnockoutBracket(tournamentId, qualifiers);
  redirect(`/tournament/${tournamentId}`);
}

function computeGroupStandings(
  teamIds: string[],
  matches: {
    teamAId: string;
    teamBId: string | null;
    winnerId: string | null;
  }[]
) {
  const stats: Record<
    string,
    { teamId: string; points: number; won: number; results: Record<string, number> }
  > = {};
  for (const tid of teamIds) {
    stats[tid] = { teamId: tid, points: 0, won: 0, results: {} };
  }
  for (const m of matches) {
    if (!m.winnerId || !m.teamBId) continue;
    const aKey = m.teamAId;
    const bKey = m.teamBId;
    const wKey = m.winnerId;
    if (wKey === aKey) {
      stats[aKey].points++;
      stats[aKey].won++;
      stats[aKey].results[bKey] = 1;
      stats[bKey].results[aKey] = 0;
    } else if (wKey === bKey) {
      stats[bKey].points++;
      stats[bKey].won++;
      stats[bKey].results[aKey] = 1;
      stats[aKey].results[bKey] = 0;
    }
  }
  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const headToHead =
      (a.results[b.teamId] ?? 0) - (b.results[a.teamId] ?? 0);
    return headToHead;
  });
}

export async function generateKnockoutBracket(
  tournamentId: string,
  teamIds: string[]
) {
  const shuffled = shuffle([...teamIds]);
  const n = shuffled.length;
  const bracketSize = nextPowerOf2(n);
  const byeCount = bracketSize - n;

  const slots: (string | null)[] = [
    ...shuffled,
    ...Array(byeCount).fill(null),
  ];

  const round: "QF" | "SF" | "Final" =
    bracketSize === 2 ? "Final" : bracketSize === 4 ? "SF" : "QF";

  const matchData = [];
  for (let i = 0; i < slots.length; i += 2) {
    const teamA = slots[i]!;
    const teamB = slots[i + 1];
    matchData.push({
      tournamentId,
      teamAId: teamA,
      teamBId: teamB,
      winnerId: teamB === null ? teamA : null,
      phase: "knockout" as const,
      round,
      bracketOrder: i / 2,
    });
  }

  await prisma.match.createMany({ data: matchData });

  const byeWinnerIds = matchData
    .filter((m) => m.teamBId === null)
    .map((m) => m.teamAId);

  if (byeWinnerIds.length > 0 && round !== "Final") {
    await advanceByeWinners(tournamentId, round);
  }
}

async function advanceByeWinners(
  tournamentId: string,
  completedRound: "QF" | "SF" | "Final"
) {
  const rounds = ["QF", "SF", "Final"] as const;
  const currentIdx = rounds.indexOf(completedRound);
  if (currentIdx === -1 || currentIdx >= rounds.length - 1) return;

  const nextRound = rounds[currentIdx + 1];
  const currentMatches = await prisma.match.findMany({
    where: { tournamentId, phase: "knockout", round: completedRound },
    orderBy: [{ bracketOrder: "asc" }, { createdAt: "asc" }],
  });

  const newMatches = [];
  for (let i = 0; i < currentMatches.length; i += 2) {
    const a = currentMatches[i];
    const b = currentMatches[i + 1];
    if (a?.winnerId && b?.winnerId) {
      newMatches.push({
        tournamentId,
        teamAId: a.winnerId,
        teamBId: b.winnerId,
        phase: "knockout" as const,
        round: nextRound,
        bracketOrder: i / 2,
      });
    }
  }
  if (newMatches.length > 0) {
    await prisma.match.createMany({ data: newMatches });
  }
}

export async function renameTeam(
  teamId: string,
  tournamentId: string,
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament || tournament.status !== "open")
    redirect(`/tournament/${tournamentId}`);

  const userTeam = await prisma.userTeam.findFirst({
    where: { userId, teamId, team: { tournamentId } },
  });
  if (!userTeam) redirect(`/tournament/${tournamentId}`);

  const rawName = formData.get("teamName");
  const name =
    typeof rawName === "string" ? rawName.trim().slice(0, 50) : null;

  await prisma.team.update({
    where: { id: teamId },
    data: { name: name || null },
  });

  redirect(`/tournament/${tournamentId}`);
}

export async function delegateMatch(
  matchId: string,
  teamIds: string[],
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { delegations: true },
  });
  if (!match) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
  });
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId !== userId) redirect("/dashboard");

  const alreadyDelegated = match.delegations.length > 0;

  if (alreadyDelegated) {
    await prisma.matchDelegation.deleteMany({ where: { matchId } });
  } else {
    await prisma.matchDelegation.createMany({
      data: teamIds.map((teamId) => ({ matchId, teamId })),
    });
  }

  redirect(`/tournament/${match.tournamentId}`);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
