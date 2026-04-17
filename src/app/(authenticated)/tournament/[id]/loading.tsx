export default function TournamentLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-5 bg-white/10 rounded animate-pulse shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-9 bg-white/10 rounded-lg w-2/3 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-36 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
      </div>

      <div className="flex gap-1">
        {["Roster", "Groups", "Bracket"].map((tab) => (
          <div key={tab} className="h-9 w-24 bg-white/10 rounded-t-lg animate-pulse" />
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl px-5 py-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 bg-white/10 rounded flex-1" />
              <div className="h-3 w-5 bg-white/10 rounded" />
              <div className="h-4 bg-white/10 rounded flex-1" />
            </div>
            {i % 2 === 0 && (
              <div className="flex gap-2">
                <div className="h-8 bg-white/10 rounded-lg flex-1" />
                <div className="h-8 bg-white/10 rounded-lg flex-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
