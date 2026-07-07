export default function RootLoading() {
  return (
    <main
      className="mx-auto min-w-0 w-full max-w-6xl animate-pulse px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      aria-busy
      aria-label="불러오는 중"
    >
      <header className="mb-10 space-y-4">
        <div className="h-6 w-40 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-9 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-72 max-w-full rounded bg-muted" />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 shrink-0 rounded-full bg-muted" />
          ))}
        </div>
        <div className="flex justify-end">
          <div className="h-7 w-24 rounded-full bg-muted" />
        </div>
      </div>

      <section className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] w-full rounded-3xl bg-muted" />
        ))}
      </section>
    </main>
  );
}
