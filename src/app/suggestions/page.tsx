import { SiteHeader } from "@/components/site-header";
import { ExternalLink } from "lucide-react";

export default function SuggestionsPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-14 space-y-3">
            <h1 className="text-5xl text-chalk tracking-tight">Suggestions</h1>
            <p className="text-chalk/60 text-lg max-w-xl mx-auto">
              What sucks about Rackit? Help us make it better.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-surface rounded-xl px-6 py-5 border border-white/10 space-y-3">
              <h2 className="text-gold">Tell us what&apos;s broken</h2>
              <p className="text-chalk/70 text-sm leading-relaxed">
                Found something that doesn&apos;t work the way you expected? A
                feature that&apos;s missing? Something that drives you up the
                wall every time you use the app? We want to hear it — no filter
                required.
              </p>
            </div>

            <div className="bg-surface rounded-xl px-6 py-5 border border-white/10 space-y-3">
              <h2 className="text-gold">How to submit feedback</h2>
              <p className="text-chalk/70 text-sm leading-relaxed">
                Log a GitHub issue and our agents will pick it up. 🤖
                
                Be as blunt as you like — the more specific, the better.
              </p>
              <a
                href="https://github.com/carlpaton/rackit/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gold hover:text-chalk transition-colors"
              >
                github.com/carlpaton/rackit/issues
                <ExternalLink className="size-4" />
              </a>
            </div>

            <div className="bg-surface rounded-xl px-6 py-5 border border-white/10 space-y-3">
              <h2 className="text-gold">What makes a good issue</h2>
              <ul className="text-chalk/70 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Describe what you were trying to do</li>
                <li>Describe what actually happened</li>
                <li>Describe what you expected to happen instead</li>
                <li>Add a screenshot if it helps</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
