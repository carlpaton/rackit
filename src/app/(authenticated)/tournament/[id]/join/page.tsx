import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Tournament } from "@/models/tournament";
import { Team } from "@/models/team";
import { User } from "@/models/user";
import { Types } from "mongoose";
import { buttonVariants } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { joinSingles, joinHalfTeam, startHalfTeam } from "./actions";

export default async function JoinTournamentPage({
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
  if (tournament.status !== "open") redirect("/dashboard");

  const existingTeam = await Team.findOne({
    tournamentId: tId,
    userIds: userId,
  }).lean();
  if (existingTeam) redirect("/dashboard");

  if (tournament.mode === "singles") {
    const joinAction = joinSingles.bind(null, id);
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl text-chalk">{tournament.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Singles tournament</p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-md space-y-4">
          <p className="text-chalk text-sm">
            You&apos;ll join as a solo player. Ready?
          </p>
          <form action={joinAction} className="flex gap-3">
            <button
              type="submit"
              className={cn(buttonVariants({ size: "default" }), "flex-1")}
            >
              <UserPlus className="size-4" />
              Join Tournament
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-chalk hover:border-white/20 transition-colors"
            >
              Cancel
            </Link>
          </form>
        </div>
      </div>
    );
  }

  const [openTeams, fullTeams] = await Promise.all([
    Team.find({ tournamentId: tId, status: "open" }).lean(),
    Team.find({ tournamentId: tId, status: "full" }).lean(),
  ]);

  const allPlayerIds = [
    ...openTeams.map((t) => t.userIds[0]),
    ...fullTeams.flatMap((t) => t.userIds),
  ];
  const partners = await User.find({ _id: { $in: allPlayerIds } })
    .select("displayName email")
    .lean();
  const partnerMap = Object.fromEntries(
    partners.map((u) => [
      u._id.toString(),
      u.displayName || (u.email as string).split("@")[0],
    ])
  );

  const startAction = startHalfTeam.bind(null, id);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl text-chalk">{tournament.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Doubles tournament</p>
      </div>

      {openTeams.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg text-chalk">Join an open slot</h2>
          <div className="space-y-2">
            {openTeams.map((team) => {
              const partnerId = team.userIds[0]?.toString() ?? "";
              const partnerName = partnerMap[partnerId] ?? "Unknown";
              const joinAction = joinHalfTeam.bind(null, id, team._id.toString());
              return (
                <div
                  key={team._id.toString()}
                  className="bg-surface rounded-xl px-5 py-4 shadow-md flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-2 text-chalk text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    {partnerName} is looking for a partner
                  </span>
                  <form action={joinAction}>
                    <button
                      type="submit"
                      className={buttonVariants({ size: "sm" })}
                    >
                      Join Team
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg text-chalk">
          {openTeams.length > 0 ? "Or start your own" : "No open slots yet"}
        </h2>
        <div className="bg-surface rounded-xl p-5 shadow-md space-y-3">
          <p className="text-muted-foreground text-sm">
            Create a half-team and wait for a partner to join you.
          </p>
          <form action={startAction} className="flex gap-3">
            <button
              type="submit"
              className={cn(buttonVariants({ size: "default" }), "flex-1")}
            >
              <UserPlus className="size-4" />
              Start a Half-Team
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-chalk hover:border-white/20 transition-colors"
            >
              Cancel
            </Link>
          </form>
        </div>
      </section>

      {fullTeams.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg text-chalk">Teams already formed</h2>
          <div className="space-y-2">
            {fullTeams.map((team) => {
              const names = team.userIds
                .map((uid: { toString(): string }) => partnerMap[uid.toString()] ?? "Unknown")
                .join(" & ");
              return (
                <div
                  key={team._id.toString()}
                  className="bg-surface rounded-xl px-5 py-4 shadow-md flex items-center gap-3"
                >
                  <Users className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-chalk text-sm">{names}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
