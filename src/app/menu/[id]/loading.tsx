export default function MenuDetailLoading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      aria-busy
      aria-label="불러오는 중"
    >
      <div className="mb-4 h-4 w-16 rounded bg-muted" />

      <div className="overflow-hidden rounded-3xl border border-border/70">
        <div className="aspect-[4/3] bg-muted sm:aspect-[16/9]" />
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-16 rounded-2xl bg-muted" />
            <div className="h-16 rounded-2xl bg-muted" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="h-64 rounded-3xl bg-muted" />
        <div className="h-64 rounded-3xl bg-muted" />
      </div>
    </main>
  );
}
