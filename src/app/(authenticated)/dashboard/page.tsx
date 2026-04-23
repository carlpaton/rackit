import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/tournament";
import Team from "@/models/team";
import User from "@/models/user";
import QuickGame from "@/models/quick-game";
import { buttonVariants } from "@/components/ui/button";
import { Users, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickGameSection, QuickGameData } from "./QuickGameSection";
import { TournamentCodeSearch } from "./TournamentCodeSearch";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  await dbConnect();

  // Tournaments where the user is a team member
  const myTeams = await Team.find({ userIds: userId }).lean();
  const myJoinedTournamentIds = myTeams.map((t) => t.tournamentId.toString());

  const myTournamentsRaw = await Tournament.find({
    $or: [
      { organizerUserId: userId },
      { _id: { $in: myJoinedTournamentIds } },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  const myTournaments = myTournamentsRaw.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    mode: t.mode,
    status: t.status,
    isPublic: t.isPublic,
    joinCode: t.joinCode,
    organizerUserId: t.organizerUserId.toString(),
    createdAt: t.createdAt,
  }));

  const myTournamentIds = myTournaments.map((t) => t.id);

  const openTournamentsRaw = await Tournament.find({
    status: "open",
    isPublic: true,
    _id: { $nin: myTournamentIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const openTournaments = openTournamentsRaw.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    mode: t.mode,
    status: t.status,
    isPublic: t.isPublic,
    joinCode: t.joinCode,
    organizerUserId: t.organizerUserId.toString(),
    createdAt: t.createdAt,
  }));

  const allIds = [...myTournamentIds, ...openTournaments.map((t) => t.id)];

  // Count full teams and total players per tournament
  const allTeams = await Team.find({ tournamentId: { $in: allIds } }).lean();
  const countMap: Record<string, number> = {};
  const playerMap: Record<string, number> = {};
  for (const team of allTeams) {
    const tid = team.tournamentId.toString();
    if (team.status === "full") {
      countMap[tid] = (countMap[tid] ?? 0) + 1;
    }
    playerMap[tid] = (playerMap[tid] ?? 0) + team.userIds.length;
  }

  // Organizer display names
  const allTournaments = [...myTournaments, ...openTournaments];
  const organizerIds = [
    ...new Set(allTournaments.map((t) => t.organizerUserId)),
  ];
  const organizers = await User.find({ _id: { $in: organizerIds } }).lean();
  const organizerMap: Record<string, string> = Object.fromEntries(
    organizers.map((u) => [
      u._id.toString(),
      u.displayName || u.email.split("@")[0],
    ])
  );

  // Quick games (waiting or active)
  const rawQuickGames = await QuickGame.find({
    $or: [{ creatorId: userId }, { opponentId: userId }],
    status: { $in: ["waiting", "active"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const qgUserIds = [
    ...new Set(
      rawQuickGames.flatMap((g) =>
        [g.creatorId.toString(), g.opponentId?.toString()].filter(
          Boolean
        ) as string[]
      )
    ),
  ];
  const qgUsers = await User.find({ _id: { $in: qgUserIds } }).lean();
  const qgUserMap = Object.fromEntries(
    qgUsers.map((u) => [
      u._id.toString(),
      u.displayName || u.email.split("@")[0],
    ])
  );

  const quickGames: QuickGameData[] = rawQuickGames.map((g) => ({
    id: g._id.toString(),
    joinCode: g.joinCode,
    status: g.status,
    creatorId: g.creatorId.toString(),
    creatorName: qgUserMap[g.creatorId.toString()] ?? "Unknown",
    opponentId: g.opponentId?.toString() ?? null,
    opponentName: g.opponentId
      ? (qgUserMap[g.opponentId.toString()] ?? "Unknown")
      : null,
    winnerId: g.winnerId?.toString() ?? null,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-chalk">Dashboard</h1>
        <Link
          href="/tournament/create"
          className={buttonVariants({ size: "default" })}
        >
          <Plus className="size-4" />
          Create Tournament
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
          My Tournaments
        </h2>
        {myTournaments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You haven&apos;t created or joined any tournaments yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myTournaments.map((t) => {
              const isOrganizer = t.organizerUserId === userId;
              const organizerName = organizerMap[t.organizerUserId];
              return (
                <div
                  key={t.id}
                  className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-chalk text-lg leading-tight">
                        {t.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!t.isPublic && (
                          <span className="text-xs bg-white/10 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="size-2.5" />
                            Private
                          </span>
                        )}
                        {isOrganizer && (
                          <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                            Organizer
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {t.mode}
                      </span>
                      <span>{countMap[t.id] ?? 0} teams</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{playerMap[t.id] ?? 0} players</span>
                      <span>Created {formatDate(t.createdAt)}</span>
                    </div>
                    {organizerName && (
                      <p className="text-xs text-muted-foreground">
                        Organised by {organizerName}
                      </p>
                    )}
                    {isOrganizer && t.status !== "complete" && (
                      <p className="text-xs font-mono text-gold/80 tracking-wider mt-1">
                        Join code: {t.joinCode.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/tournament/${t.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full"
                    )}
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <QuickGameSection userId={userId} quickGames={quickGames} />

      <section className="space-y-4">
        <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
          Open Tournaments
        </h2>
        <TournamentCodeSearch />
        {openTournaments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No open tournaments available to join.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openTournaments.map((t) => {
              const organizerName = organizerMap[t.organizerUserId];
              return (
                <div
                  key={t.id}
                  className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-chalk text-lg">{t.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {t.mode}
                      </span>
                      <span>{countMap[t.id] ?? 0} teams</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{playerMap[t.id] ?? 0} players</span>
                      <span>Created {formatDate(t.createdAt)}</span>
                    </div>
                    {organizerName && (
                      <p className="text-xs text-muted-foreground">
                        Organised by {organizerName}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/tournament/${t.id}/join`}
                    className={cn(buttonVariants({ size: "sm" }), "w-full")}
                  >
                    Join
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "text-win" },
    in_progress: { label: "In Progress", className: "text-gold" },
    complete: { label: "Complete", className: "text-muted-foreground" },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return <span className={className}>{label}</span>;
}
