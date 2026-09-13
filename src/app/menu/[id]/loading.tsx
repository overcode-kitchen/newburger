export default function MenuDetailLoading() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl animate-pulse px-4 pb-28 pt-3 sm:px-6" aria-busy aria-label="불러오는 중">
      <div className="mb-4 h-7 w-20 rounded-lg bg-muted" />
      <div className="aspect-[4/3] rounded-3xl bg-muted" />
      <div className="mt-4 h-4 w-40 rounded bg-muted" />
      <div className="mt-2 h-8 w-64 max-w-full rounded-lg bg-muted" />
      <div className="mt-4 h-24 rounded-2xl bg-muted" />
      <div className="mt-4 h-4 w-full rounded bg-muted" />
      <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
    </main>
  );
}
