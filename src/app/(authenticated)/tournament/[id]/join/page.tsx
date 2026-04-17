import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { joinSingles, joinHalfTeam, startHalfTeam } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function JoinTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });
  if (!tournament) notFound();
  if (tournament.status !== "open") redirect("/dashboard");

  const existingTeam = await prisma.userTeam.findFirst({
    where: { userId, team: { tournamentId: id } },
  });
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
            <SubmitButton className={cn(buttonVariants({ size: "default" }), "flex-1")}>
              <UserPlus className="size-4" />
              Join Tournament
            </SubmitButton>
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
    prisma.team.findMany({
      where: { tournamentId: id, status: "open" },
      include: { users: { select: { userId: true } } },
    }),
    prisma.team.findMany({
      where: { tournamentId: id, status: "full" },
      include: { users: { select: { userId: true } } },
    }),
  ]);

  const allPlayerIds = [
    ...openTeams.map((t) => t.users[0]?.userId).filter(Boolean) as string[],
    ...fullTeams.flatMap((t) => t.users.map((u) => u.userId)),
  ];
  const partners = await prisma.user.findMany({
    where: { id: { in: allPlayerIds } },
    select: { id: true, displayName: true, email: true },
  });
  const partnerMap = Object.fromEntries(
    partners.map((u) => [u.id, u.displayName || u.email.split("@")[0]])
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
              const partnerId = team.users[0]?.userId ?? "";
              const partnerName = partnerMap[partnerId] ?? "Unknown";
              const joinAction = joinHalfTeam.bind(null, id, team.id);
              return (
                <div
                  key={team.id}
                  className="bg-surface rounded-xl px-5 py-4 shadow-md flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-2 text-chalk text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    {team.name
                      ? `${team.name} (${partnerName}, looking for partner)`
                      : `${partnerName} is looking for a partner`}
                  </span>
                  <form action={joinAction}>
                    <SubmitButton className={buttonVariants({ size: "sm" })}>
                      Join Team
                    </SubmitButton>
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
          <form action={startAction} className="space-y-3">
            <div>
              <input
                type="text"
                name="teamName"
                maxLength={50}
                placeholder="Team name (optional)"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-chalk placeholder:text-muted-foreground focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex gap-3">
              <SubmitButton className={cn(buttonVariants({ size: "default" }), "flex-1")}>
                <UserPlus className="size-4" />
                Start a Half-Team
              </SubmitButton>
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-chalk hover:border-white/20 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>

      {fullTeams.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg text-chalk">Teams already formed</h2>
          <div className="space-y-2">
            {fullTeams.map((team) => {
              const names = team.users
                .map((u) => partnerMap[u.userId] ?? "Unknown")
                .join(" & ");
              const display = team.name ? `${team.name} (${names})` : names;
              return (
                <div
                  key={team.id}
                  className="bg-surface rounded-xl px-5 py-4 shadow-md flex items-center gap-3"
                >
                  <Users className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-chalk text-sm">{display}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
