export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div className="h-9 w-44 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-9 w-40 bg-white/10 rounded-lg animate-pulse" />
      </div>

      {[0, 1].map((s) => (
        <section key={s} className="space-y-4">
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-surface rounded-xl p-6 shadow-md flex flex-col gap-4 animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-5 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-2/5" />
                </div>
                <div className="h-8 bg-white/10 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
