/** 홈·브랜드 페이지 공용 스켈레톤. 헤더 한 줄 → 고지 한 줄 → 칩 → 레일 → 2열 그리드 순서를 그대로 흉내 낸다 */
export function MenuListSkeleton({ rail = true }: { rail?: boolean }) {
  return (
    <main
      className="mx-auto w-full min-w-0 max-w-6xl flex-1 animate-pulse px-4 pb-12 sm:px-6 lg:px-8"
      aria-busy
      aria-label="불러오는 중"
    >
      <div className="flex items-center justify-between pb-1 pt-3">
        <div className="h-7 w-20 rounded-lg bg-muted" />
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
      <div className="mb-3 h-4 w-64 max-w-full rounded bg-muted" />

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-muted" />
        ))}
      </div>

      {rail && (
        <section className="mt-4">
          <div className="mb-3 h-6 w-32 rounded bg-muted" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="aspect-square w-3/4 shrink-0 rounded-3xl bg-muted" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-3 h-6 w-28 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] w-full rounded-3xl bg-muted" />
          ))}
        </div>
      </section>
    </main>
  );
}
