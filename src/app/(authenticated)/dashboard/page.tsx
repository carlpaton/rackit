import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Tournaments where the user is a team member
  const myTeams = await prisma.userTeam.findMany({
    where: { userId },
    select: { team: { select: { tournamentId: true } } },
  });
  const myJoinedTournamentIds = myTeams.map((ut) => ut.team.tournamentId);

  const myTournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { organizerUserId: userId },
        { id: { in: myJoinedTournamentIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const myTournamentIds = myTournaments.map((t) => t.id);

  const openTournaments = await prisma.tournament.findMany({
    where: {
      status: "open",
      id: { notIn: myTournamentIds },
    },
    orderBy: { createdAt: "desc" },
  });

  const allIds = [...myTournamentIds, ...openTournaments.map((t) => t.id)];

  // Count full teams and total players per tournament
  const teams = await prisma.team.findMany({
    where: { tournamentId: { in: allIds } },
    select: {
      tournamentId: true,
      status: true,
      _count: { select: { users: true } },
    },
  });

  const countMap: Record<string, number> = {};
  const playerMap: Record<string, number> = {};
  for (const team of teams) {
    if (team.status === "full") {
      countMap[team.tournamentId] = (countMap[team.tournamentId] ?? 0) + 1;
    }
    playerMap[team.tournamentId] =
      (playerMap[team.tournamentId] ?? 0) + team._count.users;
  }

  // Organizer display names
  const allTournaments = [...myTournaments, ...openTournaments];
  const organizerIds = [
    ...new Set(allTournaments.map((t) => t.organizerUserId)),
  ];
  const organizers = await prisma.user.findMany({
    where: { id: { in: organizerIds } },
    select: { id: true, displayName: true, email: true },
  });
  const organizerMap: Record<string, string> = Object.fromEntries(
    organizers.map((u) => [
      u.id,
      u.displayName || u.email.split("@")[0],
    ])
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-chalk">Tournaments</h1>
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
                      {isOrganizer && (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full shrink-0">
                          Organizer
                        </span>
                      )}
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

      <section className="space-y-4">
        <h2 className="text-xl text-chalk border-b border-white/10 pb-2">
          Open Tournaments
        </h2>
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
