import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Trophy } from "lucide-react";

export default async function RankingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // ── Personal stats ────────────────────────────────────────────────────────

  // Tournament history: complete tournaments where user was a team member
  const myUserTeams = await prisma.userTeam.findMany({
    where: {
      userId,
      team: { tournament: { status: "complete" } },
    },
    include: {
      team: {
        include: {
          tournament: {
            include: {
              matches: { where: { phase: "knockout" } },
            },
          },
        },
      },
    },
  });

  type TournamentEntry = {
    id: string;
    name: string;
    position: string;
    points: number;
  };

  const myTournamentHistory: TournamentEntry[] = myUserTeams.map(({ team }) => {
    const { tournament } = team;
    const teamId = team.id;
    const position = getFinishingPosition(teamId, tournament);
    return {
      id: tournament.id,
      name: tournament.name,
      position: position.label,
      points: position.points,
    };
  });

  // Quick game record
  const myQuickGames = await prisma.quickGame.findMany({
    where: {
      OR: [{ creatorId: userId }, { opponentId: userId }],
      status: "complete",
    },
  });
  const myQGWins = myQuickGames.filter((g) => g.winnerId === userId).length;
  const myQGLosses = myQuickGames.length - myQGWins;

  // ── Global leaderboard ────────────────────────────────────────────────────

  // Tournament points leaderboard
  const completeTournaments = await prisma.tournament.findMany({
    where: { status: "complete" },
    include: {
      teams: {
        include: { users: { select: { userId: true } } },
      },
      matches: { where: { phase: "knockout" } },
    },
  });

  const userPointsMap: Record<string, number> = {};

  for (const tournament of completeTournaments) {
    for (const team of tournament.teams) {
      const { points } = getFinishingPosition(team.id, tournament);
      for (const { userId: uid } of team.users) {
        userPointsMap[uid] = (userPointsMap[uid] ?? 0) + points;
      }
    }
  }

  // Quick game wins leaderboard
  const qgWinsRaw = await prisma.quickGame.groupBy({
    by: ["winnerId"],
    where: { status: "complete", winnerId: { not: null } },
    _count: { winnerId: true },
    orderBy: { _count: { winnerId: "desc" } },
  });

  // Collect all user IDs needed for display names
  const leaderboardUserIds = [
    ...new Set([
      ...Object.keys(userPointsMap),
      ...qgWinsRaw.map((r) => r.winnerId!),
    ]),
  ];

  const leaderboardUsers = await prisma.user.findMany({
    where: { id: { in: leaderboardUserIds } },
    select: { id: true, displayName: true, email: true },
  });
  const nameMap = Object.fromEntries(
    leaderboardUsers.map((u) => [
      u.id,
      u.displayName || u.email.split("@")[0],
    ])
  );

  // Sort tournament points leaderboard
  const tournamentLeaderboard = Object.entries(userPointsMap)
    .filter(([, pts]) => pts > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([uid, pts]) => ({ userId: uid, name: nameMap[uid] ?? uid, points: pts }));

  // Quick game wins leaderboard
  const qgLeaderboard = qgWinsRaw
    .filter((r) => r.winnerId)
    .map((r) => ({
      userId: r.winnerId!,
      name: nameMap[r.winnerId!] ?? r.winnerId!,
      wins: r._count.winnerId,
    }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-3xl text-chalk">Rankings</h1>

      {/* Personal Stats */}
      <section className="space-y-6">
        <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
          Personal Stats
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tournament history */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tournament History
            </h3>
            {myTournamentHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No completed tournaments yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myTournamentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-surface rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-chalk text-sm font-medium">
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.position}
                      </p>
                    </div>
                    {entry.position === "1st" && (
                      <Trophy className="size-5 text-gold" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick game record */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Quick Game Record
            </h3>
            <div className="bg-surface rounded-lg px-4 py-6 text-center">
              {myQuickGames.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No completed quick games yet.
                </p>
              ) : (
                <p className="text-3xl font-bold text-chalk">
                  <span className="text-win">{myQGWins}W</span>
                  <span className="text-muted-foreground mx-2">/</span>
                  <span className="text-loss-text">{myQGLosses}L</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Global Leaderboard */}
      <section className="space-y-6">
        <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
          Global Leaderboard
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tournament points */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tournament Points
            </h3>
            {tournamentLeaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tournament results yet.
              </p>
            ) : (
              <div className="bg-surface rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left w-8">#</th>
                      <th className="px-4 py-2 text-left">Player</th>
                      <th className="px-4 py-2 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentLeaderboard.map((row, i) => (
                      <tr
                        key={row.userId}
                        className={`border-b border-white/5 last:border-0 ${
                          row.userId === userId ? "bg-gold/5" : ""
                        }`}
                      >
                        <td className="px-4 py-2 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 text-chalk">
                          {row.name}
                          {row.userId === userId && (
                            <span className="ml-1 text-xs text-gold">(you)</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-chalk font-mono">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              1st = 3 pts · 2nd = 2 pts · 3rd/4th = 1 pt
            </p>
          </div>

          {/* Quick game wins */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Quick Game Wins
            </h3>
            {qgLeaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No quick game results yet.
              </p>
            ) : (
              <div className="bg-surface rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left w-8">#</th>
                      <th className="px-4 py-2 text-left">Player</th>
                      <th className="px-4 py-2 text-right">Wins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qgLeaderboard.map((row, i) => (
                      <tr
                        key={row.userId}
                        className={`border-b border-white/5 last:border-0 ${
                          row.userId === userId ? "bg-gold/5" : ""
                        }`}
                      >
                        <td className="px-4 py-2 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 text-chalk">
                          {row.name}
                          {row.userId === userId && (
                            <span className="ml-1 text-xs text-gold">(you)</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-chalk font-mono">
                          {row.wins}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type TournamentWithMatches = {
  winnerTeamId: string | null;
  matches: { teamAId: string; teamBId: string | null; winnerId: string | null; round: string | null }[];
};

function getFinishingPosition(
  teamId: string,
  tournament: TournamentWithMatches
): { label: string; points: number } {
  if (tournament.winnerTeamId === teamId) return { label: "1st", points: 3 };

  const finalMatch = tournament.matches.find(
    (m) => m.round === "Final" && m.winnerId !== null
  );
  if (
    finalMatch &&
    (finalMatch.teamAId === teamId || finalMatch.teamBId === teamId)
  ) {
    return { label: "2nd", points: 2 };
  }

  const sfMatches = tournament.matches.filter(
    (m) => m.round === "SF" && m.winnerId !== null
  );
  if (sfMatches.some((m) => m.teamAId === teamId || m.teamBId === teamId)) {
    return { label: "3rd/4th", points: 1 };
  }

  const qfMatches = tournament.matches.filter(
    (m) => m.round === "QF" && m.winnerId !== null
  );
  if (qfMatches.some((m) => m.teamAId === teamId || m.teamBId === teamId)) {
    return { label: "Quarter-final", points: 0 };
  }

  return { label: "Group stage", points: 0 };
}
