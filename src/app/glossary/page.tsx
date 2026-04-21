import { SiteHeader } from "@/components/site-header";

const terms = [
  {
    term: "Round Robin",
    def: "Every team in a group plays every other team once. Everyone gets a fair run before anyone is eliminated.",
  },
  {
    term: "Group Stage",
    def: "The opening phase of the tournament. Teams are split into small groups and play a round robin to earn points. The top two from each group advance.",
  },
  {
    term: "Bracket",
    def: "The tree-shaped draw for the knockout stage. Each match produces one winner who moves to the next round; losers are out.",
  },
  {
    term: "Single Elimination",
    def: "One loss and you're done. The knockout stage uses single elimination — win every match or go home.",
  },
  {
    term: "Bye",
    def: "A free pass to the next round with no match played. Byes are given when the number of teams doesn't fill a clean bracket, and are drawn randomly.",
  },
  {
    term: "Seeding",
    def: "How teams are placed into the bracket. Rackit uses random seeding — there's no advantage for finishing top of your group.",
  },
];

export default async function GlossaryPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-14 space-y-3">
            <h1 className="text-5xl text-chalk tracking-tight">Glossary</h1>
            <p className="text-chalk/60 text-lg max-w-xl mx-auto">
              New to tournament play? Here are the terms you&apos;ll see in Rackit.
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {terms.map(({ term, def }) => (
              <div
                key={term}
                className="bg-surface rounded-xl px-5 py-4 border border-white/10 space-y-1"
              >
                <dt className="text-gold font-heading text-base">{term}</dt>
                <dd className="text-chalk/70 text-sm leading-relaxed">{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  );
}
