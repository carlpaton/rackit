import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Trophy, Users, List, GitMerge, Star } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Users,
    title: "Sign in and find a tournament",
    description:
      "Create an account or sign in. From the dashboard you can see all open tournaments and join one — or create your own as the organiser.",
    image: "/how-it-works/01-dashboard.png",
    alt: "Rackit dashboard showing tournaments",
  },
  {
    number: 2,
    icon: Users,
    title: "Teams gather in the lobby",
    description:
      "Once you join, your team appears in the tournament lobby. The organiser waits until all teams have signed up, then clicks Start Tournament to kick things off.",
    image: "/how-it-works/02-tournament-lobby.png",
    alt: "Tournament lobby with teams listed and Start Tournament button",
  },
  {
    number: 3,
    icon: List,
    title: "Group stage — round robin",
    description:
      "With more than 4 teams, everyone is split into groups. Every team plays every other team in their group once. The organiser records each result — or delegates recording to the players themselves.",
    image: "/how-it-works/04-group-matches.png",
    alt: "Group stage matches with record result buttons",
  },
  {
    number: 4,
    icon: Trophy,
    title: "Group standings decide who advances",
    description:
      "Win = 1 point, Loss = 0. The top 2 teams from each group advance to the knockout stage. If teams are level on points, head-to-head result is the tiebreaker.",
    image: "/how-it-works/04-group-standings.png",
    alt: "Group standings table showing points, wins and losses",
  },
  {
    number: 5,
    icon: GitMerge,
    title: "Knockout — single elimination",
    description:
      "Advancing teams are drawn randomly into a bracket. Quarter-finals → Semi-finals → Final. One loss and you're out. If the bracket isn't a clean power of 2, some teams receive a bye and advance automatically.",
    image: "/how-it-works/05-knockout-bracket.png",
    alt: "Knockout bracket showing QF, SF and Final matches",
  },
  {
    number: 6,
    icon: Star,
    title: "The champion is crowned",
    description:
      "The team that wins the Final is declared the tournament champion.",
    image: "/how-it-works/06-winner.png",
    alt: "Winner announcement showing the champion team",
  },
];

export default async function HowItWorksPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-surface border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="font-heading text-xl text-chalk hover:text-gold transition-colors"
          >
            Rackit
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </div>
      </header>

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

          <div className="mt-20 text-center space-y-4">
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
