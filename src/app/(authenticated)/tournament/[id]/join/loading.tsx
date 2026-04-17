export default function JoinLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-9 bg-white/10 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse" />
      </div>

      <div className="bg-surface rounded-xl p-6 shadow-md space-y-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="flex gap-3">
          <div className="h-10 bg-white/10 rounded-lg flex-1" />
          <div className="h-10 bg-white/10 rounded-lg flex-1" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-6 bg-white/10 rounded w-1/3 animate-pulse" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl px-5 py-4 shadow-md flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded flex-1" />
            <div className="h-8 w-20 bg-white/10 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
