"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/tournament";
import Team from "@/models/team";
import Group from "@/models/group";
import Match from "@/models/match";

export async function leaveTournament(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const team = await Team.findOne({ tournamentId, userIds: userId }).lean();
  if (!team) redirect("/dashboard");

  if (team.status === "full" && team.userIds.length === 2) {
    await Team.findByIdAndUpdate(team._id, {
      $pull: { userIds: userId },
      $set: { status: "open" },
    });
  } else {
    await Team.findByIdAndDelete(team._id);
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

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId) redirect("/dashboard");
  if (tournament.status !== "open") redirect("/dashboard");

  const fullTeams = await Team.find({ tournamentId, status: "full" }).lean();
  if (fullTeams.length < 2) redirect(`/tournament/${tournamentId}`);

  const path = fullTeams.length <= 4 ? "direct_knockout" : "group_stage";

  await Tournament.findByIdAndUpdate(tournamentId, {
    status: "in_progress",
    path,
  });

  const teamIds = fullTeams.map((t) => t._id.toString());

  if (path === "group_stage") {
    await generateGroupStage(tournamentId, teamIds);
  } else {
    await generateKnockoutBracket(tournamentId, teamIds);
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

    const group = await Group.create({
      tournamentId,
      name: `Group ${groupLetters[g]}`,
      teamIds: groupTeamIds,
    });

    const matchData = [];
    for (let i = 0; i < groupTeamIds.length; i++) {
      for (let j = i + 1; j < groupTeamIds.length; j++) {
        matchData.push({
          tournamentId,
          groupId: group._id,
          teamAId: groupTeamIds[i],
          teamBId: groupTeamIds[j],
          phase: "group" as const,
          delegatedTeamIds: [],
        });
      }
    }
    if (matchData.length > 0) {
      await Match.insertMany(matchData);
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

  await dbConnect();
  const match = await Match.findById(matchId).lean();
  if (!match) redirect("/dashboard");

  const tournament = await Tournament.findById(match.tournamentId).lean();
  if (!tournament || tournament.status !== "in_progress") redirect("/dashboard");

  const isOrganizer = tournament.organizerUserId.toString() === userId;
  if (!isOrganizer) {
    const userTeam = await Team.findOne({
      tournamentId: match.tournamentId,
      userIds: userId,
    }).lean();
    const isDelegated = userTeam
      ? match.delegatedTeamIds.some(
          (id) => id.toString() === userTeam._id.toString()
        )
      : false;
    if (!isDelegated) redirect(`/tournament/${match.tournamentId}`);
  }

  if (match.winnerId !== null) redirect(`/tournament/${match.tournamentId}`);

  const validTeamIds = [
    match.teamAId?.toString(),
    ...(match.teamBId ? [match.teamBId.toString()] : []),
  ];
  if (!validTeamIds.includes(winnerId))
    redirect(`/tournament/${match.tournamentId}`);

  await Match.findByIdAndUpdate(matchId, { winnerId });

  if (match.phase === "knockout") {
    await advanceKnockout(match.tournamentId.toString(), matchId, winnerId);
  }

  redirect(`/tournament/${match.tournamentId}`);
}

async function advanceKnockout(
  tournamentId: string,
  completedMatchId: string,
  winnerId: string
) {
  const rawMatches = await Match.find({ tournamentId, phase: "knockout" })
    .sort({ bracketOrder: 1, createdAt: 1 })
    .lean();

  const allKnockout = rawMatches.map((m) => ({
    id: m._id.toString(),
    round: m.round ?? null,
    winnerId: m.winnerId?.toString() ?? null,
    bracketOrder: m.bracketOrder ?? null,
  }));

  const rounds = ["QF", "SF", "Final"];
  const completedMatch = allKnockout.find((m) => m.id === completedMatchId);
  if (!completedMatch) return;

  const currentRoundIdx = rounds.indexOf(completedMatch.round ?? "");
  if (currentRoundIdx === -1 || currentRoundIdx === rounds.length - 1) {
    if (completedMatch.round === "Final") {
      await Tournament.findByIdAndUpdate(tournamentId, {
        status: "complete",
        winnerTeamId: winnerId,
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
      currentRoundMatches
        .filter((_, i) => i < pairIndex * 2)
        .filter((_, i) => i % 2 === 0).length +
      allKnockout.filter((m) => m.round === nextRound).length;

    await Match.create({
      tournamentId,
      teamAId: winnerA!,
      teamBId: winnerB,
      phase: "knockout",
      round: nextRound,
      bracketOrder: nextBracketOrder,
      delegatedTeamIds: [],
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

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId) redirect("/dashboard");
  if (tournament.status !== "in_progress" || tournament.path !== "group_stage")
    redirect(`/tournament/${tournamentId}`);

  const groupMatches = await Match.find({ tournamentId, phase: "group" }).lean();
  const allPlayed = groupMatches.every((m) => m.winnerId !== null);
  if (!allPlayed) redirect(`/tournament/${tournamentId}`);

  const groups = await Group.find({ tournamentId }).lean();
  const qualifiers: string[] = [];

  for (const group of groups) {
    const gMatches = groupMatches.filter(
      (m) => m.groupId?.toString() === group._id.toString()
    );
    const standings = computeGroupStandings(
      group.teamIds.map((id) => id.toString()),
      gMatches.map((m) => ({
        teamAId: m.teamAId?.toString() ?? "",
        teamBId: m.teamBId?.toString() ?? null,
        winnerId: m.winnerId?.toString() ?? null,
      }))
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
      (b.results[a.teamId] ?? 0) - (a.results[b.teamId] ?? 0);
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
      delegatedTeamIds: [],
    });
  }

  await Match.insertMany(matchData);

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
  const currentMatches = await Match.find({
    tournamentId,
    phase: "knockout",
    round: completedRound,
  })
    .sort({ bracketOrder: 1, createdAt: 1 })
    .lean();

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
        delegatedTeamIds: [],
      });
    }
  }
  if (newMatches.length > 0) {
    await Match.insertMany(newMatches);
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

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament || tournament.status !== "open")
    redirect(`/tournament/${tournamentId}`);

  const team = await Team.findOne({
    _id: teamId,
    tournamentId,
    userIds: userId,
  }).lean();
  if (!team) redirect(`/tournament/${tournamentId}`);

  const rawName = formData.get("teamName");
  const name =
    typeof rawName === "string" ? rawName.trim().slice(0, 50) : null;

  await Team.findByIdAndUpdate(teamId, { name: name || null });

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

  await dbConnect();
  const match = await Match.findById(matchId).lean();
  if (!match) redirect("/dashboard");

  const tournament = await Tournament.findById(match.tournamentId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId) redirect("/dashboard");

  const alreadyDelegated = match.delegatedTeamIds.length > 0;

  if (alreadyDelegated) {
    await Match.findByIdAndUpdate(matchId, { delegatedTeamIds: [] });
  } else {
    await Match.findByIdAndUpdate(matchId, { delegatedTeamIds: teamIds });
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
