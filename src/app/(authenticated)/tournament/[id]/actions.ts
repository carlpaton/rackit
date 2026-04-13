"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Team } from "@/models/team";
import { Group } from "@/models/group";
import { Match } from "@/models/match";
import { Types } from "mongoose";

export async function leaveTournament(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const tId = new Types.ObjectId(tournamentId);

  const tournament = await Tournament.findById(tId).lean();
  if (!tournament || tournament.status !== "open") redirect("/dashboard");

  const team = await Team.findOne({ tournamentId: tId, userIds: userId });
  if (!team) redirect("/dashboard");

  if (team.status === "full" && team.userIds.length === 2) {
    team.userIds = team.userIds.filter(
      (uid: Types.ObjectId) => uid.toString() !== userId.toString()
    );
    team.status = "open";
    await team.save();
  } else {
    await Team.deleteOne({ _id: team._id });
  }

  redirect("/dashboard");
}

export async function startTournament(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const tId = new Types.ObjectId(tournamentId);

  const tournament = await Tournament.findById(tId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId.toString()) redirect("/dashboard");
  if (tournament.status !== "open") redirect("/dashboard");

  const fullTeams = await Team.find({ tournamentId: tId, status: "full" }).lean();
  if (fullTeams.length < 2) redirect(`/tournament/${tournamentId}`);

  const path = fullTeams.length <= 4 ? "direct-knockout" : "group-stage";

  await Tournament.updateOne({ _id: tId }, { $set: { status: "in-progress", path } });

  if (path === "group-stage") {
    await generateGroupStage(tId, fullTeams);
  } else {
    await generateKnockoutBracket(tId, fullTeams.map((t) => t._id));
  }

  redirect(`/tournament/${tournamentId}`);
}

async function generateGroupStage(
  tournamentId: Types.ObjectId,
  fullTeams: { _id: Types.ObjectId }[]
) {
  const teamIds = shuffle(fullTeams.map((t) => t._id));
  const n = teamIds.length;
  const numGroups = Math.max(2, Math.ceil(n / 4));

  const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const matchDocs = [];

  for (let g = 0; g < numGroups; g++) {
    const start = Math.floor((g * n) / numGroups);
    const end = Math.floor(((g + 1) * n) / numGroups);
    const groupTeamIds = teamIds.slice(start, end);

    const group = await Group.create({
      tournamentId,
      name: `Group ${groupLetters[g]}`,
      teamIds: groupTeamIds,
    });

    for (let i = 0; i < groupTeamIds.length; i++) {
      for (let j = i + 1; j < groupTeamIds.length; j++) {
        matchDocs.push({
          tournamentId,
          groupId: group._id,
          teamAId: groupTeamIds[i],
          teamBId: groupTeamIds[j],
          winnerId: null,
          phase: "group",
          round: null,
          delegatedToTeamIds: [],
        });
      }
    }
  }

  if (matchDocs.length > 0) {
    await Match.insertMany(matchDocs);
  }
}

export async function recordResult(
  matchId: string,
  winnerId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const mId = new Types.ObjectId(matchId);
  const wId = new Types.ObjectId(winnerId);

  const match = await Match.findById(mId);
  if (!match) redirect("/dashboard");

  const tournament = await Tournament.findById(match.tournamentId).lean();
  if (!tournament || tournament.status !== "in-progress") redirect("/dashboard");

  const isOrganizer = tournament.organizerUserId.toString() === userId.toString();
  if (!isOrganizer) {
    const userTeam = await Team.findOne({ tournamentId: match.tournamentId, userIds: userId }).lean();
    const isDelegated = userTeam
      ? match.delegatedToTeamIds.some(
          (tid: Types.ObjectId) => tid.toString() === userTeam._id.toString()
        )
      : false;
    if (!isDelegated) redirect(`/tournament/${match.tournamentId.toString()}`);
  }

  match.winnerId = wId;
  await match.save();

  if (match.phase === "knockout") {
    await advanceKnockout(match.tournamentId, match._id, wId);
  }

  redirect(`/tournament/${match.tournamentId.toString()}`);
}

async function advanceKnockout(
  tournamentId: Types.ObjectId,
  completedMatchId: Types.ObjectId,
  winnerId: Types.ObjectId
) {
  const allKnockout = await Match.find({ tournamentId, phase: "knockout" }).sort({ _id: 1 }).lean();
  const rounds = ["QF", "SF", "Final"];
  const completedMatch = allKnockout.find(
    (m) => m._id.toString() === completedMatchId.toString()
  );
  if (!completedMatch) return;

  const currentRoundIdx = rounds.indexOf(completedMatch.round ?? "");
  if (currentRoundIdx === -1 || currentRoundIdx === rounds.length - 1) {
    if (completedMatch.round === "Final") {
      await Tournament.updateOne(
        { _id: tournamentId },
        { $set: { status: "complete", winnerTeamId: winnerId } }
      );
    }
    return;
  }

  const nextRound = rounds[currentRoundIdx + 1];
  const currentRoundMatches = allKnockout.filter((m) => m.round === completedMatch.round);

  const matchIndex = currentRoundMatches.findIndex(
    (m) => m._id.toString() === completedMatchId.toString()
  );
  const pairIndex = Math.floor(matchIndex / 2);

  const pair = currentRoundMatches.slice(pairIndex * 2, pairIndex * 2 + 2);
  const pairCompleted = pair.filter(
    (m) => m.winnerId !== null || m._id.toString() === completedMatchId.toString()
  );

  const getWinner = (m: { _id: Types.ObjectId; winnerId: Types.ObjectId | null }) =>
    m._id.toString() === completedMatchId.toString() ? winnerId : m.winnerId;

  if (pairCompleted.length === 2) {
    const winnerA = getWinner(pair[0]);
    const winnerB = pair[1] ? getWinner(pair[1]) : null;
    await Match.create({
      tournamentId,
      groupId: null,
      teamAId: winnerA,
      teamBId: winnerB,
      winnerId: null,
      phase: "knockout",
      round: nextRound,
      delegatedToTeamIds: [],
    });
  }
}

export async function advanceToKnockout(
  tournamentId: string,
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const tId = new Types.ObjectId(tournamentId);

  const tournament = await Tournament.findById(tId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId.toString()) redirect("/dashboard");
  if (tournament.status !== "in-progress" || tournament.path !== "group-stage") redirect(`/tournament/${tournamentId}`);

  const groupMatches = await Match.find({ tournamentId: tId, phase: "group" }).lean();
  const allPlayed = groupMatches.every((m) => m.winnerId !== null);
  if (!allPlayed) redirect(`/tournament/${tournamentId}`);

  const groups = await Group.find({ tournamentId: tId }).lean();
  const qualifiers: Types.ObjectId[] = [];

  for (const group of groups) {
    const gMatches = groupMatches.filter(
      (m) => m.groupId?.toString() === group._id.toString()
    );
    const standings = computeGroupStandings(group.teamIds, gMatches);
    qualifiers.push(...standings.slice(0, 2).map((s) => s.teamId));
  }

  await generateKnockoutBracket(tId, qualifiers);
  redirect(`/tournament/${tournamentId}`);
}

function computeGroupStandings(
  teamIds: Types.ObjectId[],
  matches: { teamAId: Types.ObjectId; teamBId: Types.ObjectId; winnerId: Types.ObjectId | null }[]
) {
  const stats: Record<string, { teamId: Types.ObjectId; points: number; won: number; results: Record<string, number> }> = {};
  for (const tid of teamIds) {
    stats[tid.toString()] = { teamId: tid, points: 0, won: 0, results: {} };
  }
  for (const m of matches) {
    if (!m.winnerId) continue;
    const aKey = m.teamAId.toString();
    const bKey = m.teamBId.toString();
    const wKey = m.winnerId.toString();
    if (wKey === aKey) {
      stats[aKey].points++;
      stats[aKey].won++;
      stats[aKey].results[bKey] = 1;
      stats[bKey].results[aKey] = 0;
    } else {
      stats[bKey].points++;
      stats[bKey].won++;
      stats[bKey].results[aKey] = 1;
      stats[aKey].results[bKey] = 0;
    }
  }
  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const headToHead = (a.results[b.teamId.toString()] ?? 0) - (b.results[a.teamId.toString()] ?? 0);
    return headToHead;
  });
}

export async function generateKnockoutBracket(
  tournamentId: Types.ObjectId,
  teamIds: Types.ObjectId[]
) {
  const shuffled = shuffle([...teamIds]);
  const n = shuffled.length;
  const bracketSize = nextPowerOf2(n);
  const byeCount = bracketSize - n;

  const slots: (Types.ObjectId | null)[] = [...shuffled, ...Array(byeCount).fill(null)];

  const round = bracketSize === 2 ? "Final" : bracketSize === 4 ? "SF" : "QF";
  const matchDocs = [];

  for (let i = 0; i < slots.length; i += 2) {
    const teamA = slots[i]!;
    const teamB = slots[i + 1];
    matchDocs.push({
      tournamentId,
      groupId: null,
      teamAId: teamA,
      teamBId: teamB,
      winnerId: teamB === null ? teamA : null,
      phase: "knockout",
      round,
      delegatedToTeamIds: [],
    });
  }

  await Match.insertMany(matchDocs);

  const byeWinners = matchDocs
    .filter((m) => m.teamBId === null)
    .map((m) => m.teamAId);

  if (byeWinners.length > 0 && round !== "Final") {
    await advanceByeWinners(tournamentId, round, byeWinners);
  }
}

async function advanceByeWinners(
  tournamentId: Types.ObjectId,
  completedRound: string,
  _byeWinners: Types.ObjectId[]
) {
  const rounds = ["QF", "SF", "Final"];
  const currentIdx = rounds.indexOf(completedRound);
  if (currentIdx === -1 || currentIdx >= rounds.length - 1) return;

  const nextRound = rounds[currentIdx + 1];
  const currentMatches = await Match.find({
    tournamentId,
    phase: "knockout",
    round: completedRound,
  }).sort({ _id: 1 }).lean();

  for (let i = 0; i < currentMatches.length; i += 2) {
    const a = currentMatches[i];
    const b = currentMatches[i + 1];
    if (a?.winnerId && b?.winnerId) {
      await Match.create({
        tournamentId,
        groupId: null,
        teamAId: a.winnerId,
        teamBId: b.winnerId,
        winnerId: null,
        phase: "knockout",
        round: nextRound,
        delegatedToTeamIds: [],
      });
    }
  }
}

export async function delegateMatch(
  matchId: string,
  teamIds: string[],
  _formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);
  const mId = new Types.ObjectId(matchId);

  const match = await Match.findById(mId);
  if (!match) redirect("/dashboard");

  const tournament = await Tournament.findById(match.tournamentId).lean();
  if (!tournament) redirect("/dashboard");
  if (tournament.organizerUserId.toString() !== userId.toString()) redirect("/dashboard");

  const alreadyDelegated = match.delegatedToTeamIds.length > 0;
  if (alreadyDelegated) {
    match.delegatedToTeamIds = [];
  } else {
    match.delegatedToTeamIds = teamIds.map((id) => new Types.ObjectId(id));
  }
  await match.save();

  redirect(`/tournament/${match.tournamentId.toString()}`);
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
