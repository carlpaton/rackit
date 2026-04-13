import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Team } from "@/models/team";
import { User } from "@/models/user";
import { Types } from "mongoose";
import { buttonVariants } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);

  const myTeams = await Team.find({ userIds: userId }).lean();
  const myJoinedTournamentIds = myTeams.map((t) => t.tournamentId);

  const myTournaments = await Tournament.find({
    $or: [
      { organizerUserId: userId },
      { _id: { $in: myJoinedTournamentIds } },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  const myTournamentObjectIds = myTournaments.map((t) => t._id);

  const openTournaments = await Tournament.find({
    status: "open",
    _id: { $nin: myTournamentObjectIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const allIds = [
    ...myTournamentObjectIds,
    ...openTournaments.map((t) => t._id),
  ];

  const teamCountAgg = await Team.aggregate([
    { $match: { tournamentId: { $in: allIds }, status: "full" } },
    { $group: { _id: "$tournamentId", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = Object.fromEntries(
    teamCountAgg.map((r: { _id: Types.ObjectId; count: number }) => [
      r._id.toString(),
      r.count,
    ])
  );

  const playerCountAgg = await Team.aggregate([
    { $match: { tournamentId: { $in: allIds } } },
    { $project: { tournamentId: 1, n: { $size: "$userIds" } } },
    { $group: { _id: "$tournamentId", total: { $sum: "$n" } } },
  ]);
  const playerMap: Record<string, number> = Object.fromEntries(
    playerCountAgg.map((r: { _id: Types.ObjectId; total: number }) => [
      r._id.toString(),
      r.total,
    ])
  );

  const allTournaments = [...myTournaments, ...openTournaments];
  const organizerIds = [...new Set(allTournaments.map((t) => t.organizerUserId.toString()))];
  const organizers = await User.find({
    _id: { $in: organizerIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("displayName email")
    .lean();
  const organizerMap: Record<string, string> = Object.fromEntries(
    organizers.map((u) => [
      u._id.toString(),
      (u.displayName as string) || (u.email as string).split("@")[0],
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
              const id = t._id.toString();
              const isOrganizer =
                t.organizerUserId.toString() === session.user.id;
              const organizerName = organizerMap[t.organizerUserId.toString()];
              return (
                <div
                  key={id}
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
                      <span>{countMap[id] ?? 0} teams</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{playerMap[id] ?? 0} players</span>
                      <span>Created {formatDate(t.createdAt)}</span>
                    </div>
                    {organizerName && (
                      <p className="text-xs text-muted-foreground">
                        Organised by {organizerName}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/tournament/${id}`}
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
              const id = t._id.toString();
              const organizerName = organizerMap[t.organizerUserId.toString()];
              return (
                <div
                  key={id}
                  className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-chalk text-lg">{t.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {t.mode}
                      </span>
                      <span>{countMap[id] ?? 0} teams</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{playerMap[id] ?? 0} players</span>
                      <span>Created {formatDate(t.createdAt)}</span>
                    </div>
                    {organizerName && (
                      <p className="text-xs text-muted-foreground">
                        Organised by {organizerName}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/tournament/${id}/join`}
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
    "in-progress": { label: "In Progress", className: "text-gold" },
    complete: { label: "Complete", className: "text-muted-foreground" },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return <span className={className}>{label}</span>;
}
