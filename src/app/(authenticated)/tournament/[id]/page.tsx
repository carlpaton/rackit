import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Team } from "@/models/team";
import { User } from "@/models/user";
import { Group } from "@/models/group";
import { Match } from "@/models/match";
import { Types } from "mongoose";
import { buttonVariants } from "@/components/ui/button";
import { Users, ArrowLeft, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { leaveTournament, startTournament, recordResult, advanceToKnockout, delegateMatch, renameTeam } from "./actions";
import { TournamentTabs } from "./TournamentTabs";
import { RenameTeamForm } from "./RenameTeamForm";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const tId = new Types.ObjectId(id);
  const userId = new Types.ObjectId(session.user.id);

  const tournament = await Tournament.findById(tId).lean();
  if (!tournament) notFound();

  const isOrganizer = tournament.organizerUserId.toString() === session.user.id;

  const teams = await Team.find({ tournamentId: tId }).lean();
  const fullTeams = teams.filter((t) => t.status === "full");
  const openTeams = teams.filter((t) => t.status === "open");

  const allUserIds = teams.flatMap((t) => t.userIds);
  const users = await User.find({ _id: { $in: allUserIds } })
    .select("displayName email")
    .lean();
  const userMap: Record<string, string> = Object.fromEntries(
    users.map((u) => [
      u._id.toString(),
      (u.displayName as string) || (u.email as string).split("@")[0],
    ])
  );

  const myTeam = teams.find((t) =>
    t.userIds.some((uid: Types.ObjectId) => uid.toString() === session.user.id)
  );
  const myTeamId = myTeam?._id.toString();
  const isInTournament = !!myTeam;
  const canLeave = isInTournament && tournament.status === "open";
  const canStart = isOrganizer && tournament.status === "open" && fullTeams.length >= 2;
  const canJoin = !isInTournament && tournament.status === "open";

  function teamLabel(team: { userIds: Types.ObjectId[]; status: string; name?: string }) {
    const names = team.userIds.map((uid) => userMap[uid.toString()] ?? "Unknown");
    if (team.status === "open") {
      return team.name
        ? `${team.name} (${names[0]}, looking for partner)`
        : `${names[0]} (looking for partner)`;
    }
    const playerPart = names.join(" & ");
    return team.name ? `${team.name} (${playerPart})` : playerPart;
  }

  const teamNameMap: Record<string, string> = Object.fromEntries(
    teams.map((t) => [t._id.toString(), teamLabel(t)])
  );

  const leaveAction = leaveTournament.bind(null, id);
  const startAction = startTournament.bind(null, id);
  const advanceAction = advanceToKnockout.bind(null, id);

  const groups = await Group.find({ tournamentId: tId }).lean();
  const matches = await Match.find({ tournamentId: tId }).lean();

  const groupMatches = matches.filter((m) => m.phase === "group");
  const knockoutMatches = matches.filter((m) => m.phase === "knockout");

  const allGroupMatchesPlayed =
    groupMatches.length > 0 && groupMatches.every((m) => m.winnerId !== null);
  const bracketLocked = tournament.path === "group-stage" && !allGroupMatchesPlayed;
  const showGroups = tournament.status !== "open" && tournament.path === "group-stage";

  const defaultTab =
    tournament.status === "open"
      ? "roster"
      : tournament.status === "complete"
      ? "bracket"
      : tournament.path === "group-stage"
      ? "groups"
      : "bracket";

  const winnerTeam = tournament.winnerTeamId
    ? teams.find((t) => t._id.toString() === tournament.winnerTeamId?.toString())
    : null;

  function canRecordMatch(match: { delegatedToTeamIds: Types.ObjectId[] }) {
    if (isOrganizer) return true;
    if (!myTeamId) return false;
    return match.delegatedToTeamIds.some(
      (tid: Types.ObjectId) => tid.toString() === myTeamId
    );
  }

  function isMyMatch(match: { teamAId: Types.ObjectId; teamBId: Types.ObjectId | null }) {
    if (!myTeamId) return false;
    return (
      match.teamAId.toString() === myTeamId ||
      match.teamBId?.toString() === myTeamId
    );
  }

  const rosterContent = (
    <section className="space-y-3">
      <h2 className="text-xl text-chalk">
        Teams{" "}
        <span className="text-muted-foreground text-base font-normal">
          ({fullTeams.length} full{openTeams.length > 0 ? `, ${openTeams.length} open` : ""})
        </span>
      </h2>
      {teams.length === 0 ? (
        <p className="text-muted-foreground text-sm">No teams yet.</p>
      ) : (
        <div className="space-y-2">
          {fullTeams.map((team) => {
            const isMyTeam = myTeam?._id.toString() === team._id.toString();
            const canRename = isMyTeam && tournament.status === "open" && tournament.mode === "doubles";
            const label = teamLabel(team);
            return (
              <div key={team._id.toString()} className="bg-surface rounded-xl px-5 py-3 text-chalk text-sm flex items-center gap-2">
                <Users className="size-4 text-muted-foreground shrink-0" />
                {canRename ? (
                  <RenameTeamForm
                    teamId={team._id.toString()}
                    tournamentId={id}
                    currentName={team.name ?? ""}
                    displayLabel={label}
                  />
                ) : label}
              </div>
            );
          })}
          {openTeams.map((team) => {
            const isMyTeam = myTeam?._id.toString() === team._id.toString();
            const canRename = isMyTeam && tournament.status === "open" && tournament.mode === "doubles";
            const label = teamLabel(team);
            return (
              <div key={team._id.toString()} className="bg-surface rounded-xl px-5 py-3 text-muted-foreground text-sm flex items-center gap-2 italic">
                <Users className="size-4 shrink-0" />
                {canRename ? (
                  <RenameTeamForm
                    teamId={team._id.toString()}
                    tournamentId={id}
                    currentName={team.name ?? ""}
                    displayLabel={label}
                  />
                ) : label}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const groupsContent = (
    <section className="space-y-8">
      {isOrganizer && allGroupMatchesPlayed && knockoutMatches.length === 0 && (
        <form action={advanceAction}>
          <button type="submit" className={buttonVariants({ size: "default" })}>
            Advance to Knockout
          </button>
        </form>
      )}
      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Groups not yet generated.</p>
      ) : (
        groups.map((group) => {
          const gMatches = groupMatches.filter(
            (m) => m.groupId?.toString() === group._id.toString()
          );
          const standings = computeStandings(group.teamIds, gMatches, teamNameMap);
          return (
            <div key={group._id.toString()} className="space-y-4">
              <h3 className="text-chalk text-lg">{group.name}</h3>
              <StandingsTable standings={standings} />
              <div className="space-y-2">
                {gMatches.map((match) => {
                  const canRecord = canRecordMatch(match);
                  const inMyMatch = isMyMatch(match);
                  const isDelegated = myTeamId
                    ? match.delegatedToTeamIds.some(
                        (tid: Types.ObjectId) => tid.toString() === myTeamId
                      )
                    : false;
                  const recordA = recordResult.bind(null, match._id.toString(), match.teamAId.toString());
                  const recordB = match.teamBId
                    ? recordResult.bind(null, match._id.toString(), match.teamBId.toString())
                    : null;
                  const delegateAction = isOrganizer && inMyMatch === false && !match.winnerId
                    ? delegateMatch.bind(
                        null,
                        match._id.toString(),
                        [match.teamAId.toString(), match.teamBId?.toString() ?? ""].filter(Boolean)
                      )
                    : null;
                  return (
                    <MatchCard
                      key={match._id.toString()}
                      match={match}
                      teamNameMap={teamNameMap}
                      canRecord={canRecord}
                      isDelegated={isDelegated}
                      isOrganizer={isOrganizer}
                      recordAAction={recordA}
                      recordBAction={recordB}
                      delegateAction={delegateAction}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </section>
  );

  const bracketContent = (
    <section className="space-y-6">
      {winnerTeam && (
        <div className="bg-surface rounded-xl p-6 flex items-center gap-4">
          <Trophy className="size-8 text-gold" />
          <div>
            <p className="text-muted-foreground text-sm">Winner</p>
            <p className="text-chalk text-xl">{teamLabel(winnerTeam)}</p>
          </div>
        </div>
      )}
      {knockoutMatches.length === 0 ? (
        <p className="text-muted-foreground text-sm">Bracket not yet generated.</p>
      ) : (
        <BracketView
          matches={knockoutMatches}
          teamNameMap={teamNameMap}
          isOrganizer={isOrganizer}
          myTeamId={myTeamId}
          canRecordMatch={canRecordMatch}
        />
      )}
    </section>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-chalk transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl text-chalk">{tournament.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {tournament.mode}
            </span>
            <StatusBadge status={tournament.status} />
          </div>
        </div>
      </div>

      {tournament.status === "open" && (
        <div className="flex flex-wrap gap-3">
          {canJoin && (
            <Link href={`/tournament/${id}/join`} className={buttonVariants({ size: "default" })}>
              Join Tournament
            </Link>
          )}
          {canLeave && (
            <form action={leaveAction}>
              <button type="submit" className={cn(buttonVariants({ variant: "destructive", size: "default" }))}>
                Leave Tournament
              </button>
            </form>
          )}
          {canStart && (
            <form action={startAction}>
              <button type="submit" className={cn(buttonVariants({ size: "default" }))}>
                Start Tournament
              </button>
            </form>
          )}
          {isOrganizer && fullTeams.length < 2 && (
            <p className="text-muted-foreground text-sm self-center">
              Need at least 2 full teams to start.
            </p>
          )}
        </div>
      )}

      <TournamentTabs
        defaultTab={defaultTab as "roster" | "groups" | "bracket"}
        bracketLocked={bracketLocked}
        showGroups={showGroups}
        rosterContent={rosterContent}
        groupsContent={groupsContent}
        bracketContent={bracketContent}
      />
    </div>
  );
}

function MatchCard({
  match,
  teamNameMap,
  canRecord,
  isDelegated,
  isOrganizer,
  recordAAction,
  recordBAction,
  delegateAction,
}: {
  match: {
    _id: Types.ObjectId;
    teamAId: Types.ObjectId;
    teamBId: Types.ObjectId | null;
    winnerId: Types.ObjectId | null;
    delegatedToTeamIds: Types.ObjectId[];
  };
  teamNameMap: Record<string, string>;
  canRecord: boolean;
  isDelegated: boolean;
  isOrganizer: boolean;
  recordAAction: (fd: FormData) => Promise<void>;
  recordBAction: ((fd: FormData) => Promise<void>) | null;
  delegateAction: ((fd: FormData) => Promise<void>) | null;
}) {
  const aName = teamNameMap[match.teamAId.toString()] ?? "Unknown";
  const bName = match.teamBId ? teamNameMap[match.teamBId.toString()] ?? "Unknown" : "BYE";
  const winnerKey = match.winnerId?.toString();
  const played = !!match.winnerId;

  return (
    <div className="bg-surface rounded-xl px-5 py-4 space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <span className={cn("flex-1 text-chalk", winnerKey === match.teamAId.toString() && "text-win font-medium")}>
          {aName}
        </span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span className={cn("flex-1 text-right text-chalk", match.teamBId && winnerKey === match.teamBId.toString() && "text-win font-medium")}>
          {bName}
        </span>
        {played && <span className="text-xs text-win shrink-0">✓</span>}
      </div>

      {!played && canRecord && match.teamBId && (
        <div className="flex gap-2">
          <form action={recordAAction} className="flex-1">
            <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-win border-win/30 hover:border-win/60")}>
              {aName} won
            </button>
          </form>
          {recordBAction && (
            <form action={recordBAction} className="flex-1">
              <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-win border-win/30 hover:border-win/60")}>
                {bName} won
              </button>
            </form>
          )}
        </div>
      )}

      {!played && isOrganizer && delegateAction && (
        <form action={delegateAction}>
          <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs text-muted-foreground")}>
            {isDelegated ? "Revoke delegation" : "Delegate to players"}
          </button>
        </form>
      )}
    </div>
  );
}

function BracketView({
  matches,
  teamNameMap,
  isOrganizer,
  myTeamId,
  canRecordMatch,
}: {
  matches: {
    _id: Types.ObjectId;
    teamAId: Types.ObjectId;
    teamBId: Types.ObjectId | null;
    winnerId: Types.ObjectId | null;
    round: string | null;
    delegatedToTeamIds: Types.ObjectId[];
  }[];
  teamNameMap: Record<string, string>;
  isOrganizer: boolean;
  myTeamId?: string;
  canRecordMatch: (match: { delegatedToTeamIds: Types.ObjectId[] }) => boolean;
}) {
  const rounds = ["QF", "SF", "Final"];
  const grouped: Record<string, typeof matches> = {};
  for (const r of rounds) {
    grouped[r] = matches.filter((m) => m.round === r);
  }

  return (
    <div className="space-y-6">
      {rounds.map((round) =>
        grouped[round].length === 0 ? null : (
          <div key={round} className="space-y-2">
            <h4 className="text-muted-foreground text-xs uppercase tracking-wider">{round}</h4>
            {grouped[round].map((match) => {
              const canRecord = canRecordMatch(match);
              const recordA = recordResult.bind(null, match._id.toString(), match.teamAId.toString());
              const recordB = match.teamBId
                ? recordResult.bind(null, match._id.toString(), match.teamBId.toString())
                : null;
              return (
                <MatchCard
                  key={match._id.toString()}
                  match={match}
                  teamNameMap={teamNameMap}
                  canRecord={canRecord}
                  isDelegated={false}
                  isOrganizer={isOrganizer}
                  recordAAction={recordA}
                  recordBAction={recordB}
                  delegateAction={null}
                />
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function computeStandings(
  teamIds: Types.ObjectId[],
  matches: { teamAId: Types.ObjectId; teamBId: Types.ObjectId; winnerId: Types.ObjectId | null }[],
  teamNameMap: Record<string, string>
) {
  const stats: Record<string, { name: string; played: number; won: number; lost: number; points: number }> = {};
  for (const tid of teamIds) {
    const key = tid.toString();
    stats[key] = { name: teamNameMap[key] ?? "Unknown", played: 0, won: 0, lost: 0, points: 0 };
  }
  for (const m of matches) {
    if (!m.winnerId) continue;
    const aKey = m.teamAId.toString();
    const bKey = m.teamBId.toString();
    const wKey = m.winnerId.toString();
    if (stats[aKey]) stats[aKey].played++;
    if (stats[bKey]) stats[bKey].played++;
    if (wKey === aKey) {
      stats[aKey].won++;
      stats[aKey].points++;
      if (stats[bKey]) stats[bKey].lost++;
    } else {
      stats[bKey].won++;
      stats[bKey].points++;
      if (stats[aKey]) stats[aKey].lost++;
    }
  }
  return Object.values(stats).sort((a, b) => b.points - a.points || b.won - a.won);
}

function StandingsTable({
  standings,
}: {
  standings: { name: string; played: number; won: number; lost: number; points: number }[];
}) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs border-b border-white/10">
            <th className="text-left px-4 py-2">Team</th>
            <th className="text-center px-3 py-2">P</th>
            <th className="text-center px-3 py-2">W</th>
            <th className="text-center px-3 py-2">L</th>
            <th className="text-center px-3 py-2 text-gold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              <td className="text-chalk px-4 py-2">{row.name}</td>
              <td className="text-center text-muted-foreground px-3 py-2">{row.played}</td>
              <td className="text-center text-win px-3 py-2">{row.won}</td>
              <td className="text-center text-loss px-3 py-2">{row.lost}</td>
              <td className="text-center text-gold font-medium px-3 py-2">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "text-win" },
    "in-progress": { label: "In Progress", className: "text-gold" },
    complete: { label: "Complete", className: "text-muted-foreground" },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return <span className={className}>{label}</span>;
}
