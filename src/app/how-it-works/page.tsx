import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Trophy, Users, List, GitMerge, Star, Zap, BarChart2, PlusCircle, Key } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const steps = [
  {
    number: 1,
    icon: Users,
    title: "Sign in and find a tournament",
    description:
      "Sign in and you land on the dashboard. See all your tournaments at a glance, browse open ones, or search for a private tournament by its join code. Organisers see their tournament's join code so they can share it with players.",
    image: "/how-it-works/01-dashboard.png",
    alt: "Rackit dashboard showing My Tournaments, Quick Games, and Open Tournaments sections",
  },
  {
    number: 2,
    icon: PlusCircle,
    title: "Create your tournament",
    description:
      "Create a new tournament in seconds. Pick Singles (1 player per team) or Doubles (2 players per team), then choose Public — anyone can browse and join — or Private, where players can only enter via your join code.",
    image: "/how-it-works/02-create-tournament.png",
    alt: "Create Tournament form showing Singles/Doubles mode and Public/Private visibility options",
  },
  {
    number: 3,
    icon: Key,
    title: "Teams gather in the lobby",
    description:
      "Once a team joins, they appear in the tournament lobby. The organiser's join code is shown prominently — share it with players so they can find the tournament instantly. When all teams are in, hit Start Tournament to kick things off.",
    image: "/how-it-works/03-tournament-lobby.png",
    alt: "Tournament lobby showing join code and list of registered teams",
  },
  {
    number: 4,
    icon: List,
    title: "Group stage — round robin",
    description:
      "With more than 4 teams, everyone is split into groups. Every team plays every other team in their group once. The organiser records each result — or delegates recording to the players themselves to remove the bottleneck.",
    image: "/how-it-works/04-group-matches.png",
    alt: "Group stage showing all four groups with matches and record result buttons",
  },
  {
    number: 5,
    icon: Trophy,
    title: "Group standings decide who advances",
    description:
      "Win = 1 point, Loss = 0. The top 2 teams from each group advance to the knockout stage. If teams are level on points, the head-to-head result between them is the tiebreaker.",
    image: "/how-it-works/04-group-standings.png",
    alt: "Group standings table showing points, wins and losses for all four groups",
  },
  {
    number: 6,
    icon: GitMerge,
    title: "Knockout — single elimination",
    description:
      "Advancing teams are randomly drawn into a bracket. Quarter-finals → Semi-finals → Final. One loss and you're out. If the bracket isn't a clean power of 2, some teams receive a bye and advance automatically.",
    image: "/how-it-works/05-knockout-bracket.png",
    alt: "Knockout bracket showing Quarter-final matches with record result buttons",
  },
  {
    number: 7,
    icon: Star,
    title: "The champion is crowned",
    description:
      "The team that wins the Final is declared the tournament champion. The full bracket — QF, SF, and Final results — is preserved so everyone can relive the journey.",
    image: "/how-it-works/06-winner.png",
    alt: "Completed tournament showing the champion team and full bracket results",
  },
  {
    number: 8,
    icon: Zap,
    title: "Quick Games — no tournament needed",
    description:
      "Want a casual match right now? Hit Create New Game and share the code with your opponent — they enter it and the game starts instantly. Quick game results count towards your personal record on the Rankings page.",
    image: "/how-it-works/07-quick-games.png",
    alt: "Dashboard Quick Games section showing Create New Game button and join code input",
  },
  {
    number: 9,
    icon: BarChart2,
    title: "Rankings — track your form",
    description:
      "Every player has a rankings profile. See your tournament history, your quick game win/loss record, and how you stack up against everyone else on the global leaderboard.",
    image: "/how-it-works/08-rankings.png",
    alt: "Rankings page showing personal stats, tournament history, and global leaderboard",
  },
];

export default async function HowItWorksPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-14 space-y-3">
            <h1 className="text-5xl text-chalk tracking-tight">
              How It Works
            </h1>
            <p className="text-chalk/60 text-lg max-w-xl mx-auto">
              From sign-up to champion — everything you need to run a pool
              tournament with Rackit.
            </p>
          </div>

          <div className="space-y-20">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center size-9 rounded-full bg-gold/20 text-gold font-heading text-lg font-bold">
                      {step.number}
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-gold" />
                        <h2 className="text-2xl text-chalk tracking-tight">
                          {step.title}
                        </h2>
                      </div>
                      <p className="text-chalk/70 leading-relaxed max-w-2xl">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl">
                    <Image
                      src={step.image}
                      alt={step.alt}
                      width={1280}
                      height={800}
                      className="w-full h-auto"
                      priority={i < 2}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-20 text-center">
            <p className="text-chalk/50 text-sm">
              Unfamiliar with any terms?{" "}
              <Link href="/glossary" className="text-gold hover:underline">
                Check the glossary
              </Link>
            </p>
          </div>

          <div className="mt-12 text-center space-y-4">
            <h2 className="text-3xl text-chalk">Ready to play?</h2>
            <p className="text-chalk/60">
              {isLoggedIn
                ? "Head to your dashboard to start or join a tournament."
                : "Sign in and start or join a tournament today."}
            </p>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className={buttonVariants({ size: "lg" })}
            >
              {isLoggedIn ? "Go to dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
