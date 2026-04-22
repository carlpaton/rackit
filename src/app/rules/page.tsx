import { SiteHeader } from "@/components/site-header";

const playingRules = [
  {
    title: "Aim of the Game",
    body: "Each player is assigned a group of balls — either solids (1–7) or stripes (9–15) — after the break. Pocket all your balls, then legally pot the 8-ball to win.",
  },
  {
    title: "The Rack",
    body: "15 object balls are racked in a triangle at the foot spot. The 8-ball sits in the centre. One solid and one stripe occupy the two bottom corners; the remaining balls are random.",
  },
  {
    title: "Break Shot",
    body: "The cue ball is played from behind the head string. A legal break requires the cue ball to contact the racked balls and either pocket a ball or drive at least four object balls to a cushion. Groups are not assigned until a ball is pocketed after the break.",
  },
  {
    title: "Ball Groups",
    body: "The player who legally pockets the first ball after the break is assigned that group (solids or stripes). Their opponent takes the other group. If both a solid and a stripe are pocketed on the same shot, the shooter chooses their group.",
  },
  {
    title: "Calling Shots",
    body: "For each shot you must nominate the ball and the pocket. Cushion contacts and incidental pots do not need to be called. If the called ball is legally pocketed you continue your turn, even if other balls also drop — as long as no foul occurred.",
  },
  {
    title: "Standard Fouls",
    body: "A foul occurs when: the cue ball is potted (in-off); the cue ball doesn't contact your group's ball first; no ball reaches a cushion after contact; a ball is played off the table; or the cue ball is played before all balls have come to rest. After a foul, the opponent plays from where the cue ball lies or, in some formats, takes ball-in-hand.",
  },
  {
    title: "Winning and Losing",
    body: "Legally pocket the 8-ball after clearing all your group's balls to win. You lose if you pot the 8-ball before clearing your group, pot the 8-ball on the break (re-rack), or commit a foul while potting the 8-ball.",
  },
];

const rackitRules = [
  {
    title: "Win or Loss — No Scores",
    body: "Rackit records match results as a simple win or loss. There are no frames, no scores, and no draws. Every match produces exactly one winner.",
  },
  {
    title: "Small Tournaments (≤ 4 teams)",
    body: "Four or fewer teams skip the group stage entirely and go straight to knockout. Two teams play a Final; four teams play two Semi-finals then a Final.",
  },
  {
    title: "Group Stage (5+ teams)",
    body: "Teams are split into groups of 3–4 and play a round-robin — every team faces every other team in their group once. Win = 1 point, Loss = 0 points. The top two teams from each group advance. Ties are broken by the head-to-head result between the tied teams.",
  },
  {
    title: "Knockout Stage",
    body: "The knockout bracket uses single elimination — one loss and you're out. Seeding is random; there's no advantage for finishing top of your group. If the number of advancing teams doesn't fill a clean bracket, byes are assigned randomly and those teams advance automatically.",
  },
  {
    title: "Quick Games",
    body: "Quick Games are one-off matches outside any tournament. One player creates a game and shares the join code; the other player enters it to accept. Either player records the result. Quick game results appear on the Rankings page separately from tournament history.",
  },
];

export default function RulesPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-14 space-y-3">
            <h1 className="text-5xl text-chalk tracking-tight">Rules</h1>
            <p className="text-chalk/60 text-lg max-w-xl mx-auto">
              International 8-ball rules and how Rackit tournaments work.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl text-chalk mb-6">
              Playing Rules{" "}
              <span className="text-base font-sans font-normal text-chalk/40">
                WPA International 8-Ball
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {playingRules.map(({ title, body }) => (
                <div
                  key={title}
                  className="bg-surface rounded-xl px-5 py-4 border border-white/10 space-y-1"
                >
                  <h3 className="text-gold font-heading text-base">{title}</h3>
                  <p className="text-chalk/70 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-chalk mb-6">How Rackit Works</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rackitRules.map(({ title, body }) => (
                <div
                  key={title}
                  className="bg-surface rounded-xl px-5 py-4 border border-white/10 space-y-1"
                >
                  <h3 className="text-gold font-heading text-base">{title}</h3>
                  <p className="text-chalk/70 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
