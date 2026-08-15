import Link from "next/link";
import { BrandChips } from "@/components/brand-chips";
import { MenuCard } from "@/components/menu-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getHomeSections, hasSupabaseEnv } from "@/lib/menu-data";
import { BRAND_LABELS, parseBrand } from "@/lib/newburger";

interface HomeProps {
  searchParams: Promise<{ brand?: string }>;
}

/**
 * 홈 = "오늘 도전할 것 고르기" 한 가지. 상시 메뉴·검색·정렬 옵션·온보딩 없음.
 * 이번 주 나온 것은 가로 레일로, 나머지 신메뉴는 그리드로 — 형태가 다르면 제목을 안 읽어도 구분된다.
 */
export default async function Home({ searchParams }: HomeProps) {
  const query = await searchParams;
  const selectedBrand = parseBrand(query.brand);
  const { thisWeek, recent } = await getHomeSections(selectedBrand);
  const isEmpty = thisWeek.length === 0 && recent.length === 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        <p className="pb-3 text-sm text-muted-foreground">
          4개 브랜드 신버거를 모아 보는 비공식 서비스 · 매일 아침 갱신
        </p>

        {!hasSupabaseEnv && (
          <div className="mb-4 rounded-2xl border border-dashed border-border bg-muted/80 p-4 text-sm text-muted-foreground">
            Supabase 환경변수가 비어있습니다. `.env.local` 값을 채운 뒤 다시 새로고침해 주세요.
          </div>
        )}

        <BrandChips selected={selectedBrand} />

        {thisWeek.length > 0 && (
          <section className="mt-4" aria-labelledby="this-week">
            <h2 id="this-week" className="mb-3 flex items-baseline gap-2 text-lg font-bold tracking-tight">
              이번 주 나왔어요
              <span className="font-mono text-xs font-normal text-muted-foreground">{thisWeek.length}</span>
            </h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {thisWeek.map((group, i) => (
                <MenuCard key={group.key} group={group} variant="rail" priority={i < 2} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-5" aria-labelledby="recent">
          <h2 id="recent" className="mb-3 flex items-baseline gap-2 text-lg font-bold tracking-tight">
            요즘 신버거
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {recent.length} · 최근 6개월
            </span>
          </h2>
          {recent.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {recent.map((group, i) => (
                <MenuCard key={group.key} group={group} priority={thisWeek.length === 0 && i < 4} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                {isEmpty ? "아직 신버거가 없어요" : "이번 주 것이 전부예요"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedBrand === "all"
                  ? "매일 아침 확인하고 있어요. 새로 나오면 여기에 올라와요."
                  : `${BRAND_LABELS[selectedBrand]}에는 지금 신버거가 없어요. 다른 브랜드를 볼까요?`}
              </p>
            </div>
          )}
        </section>

        <Link
          href={selectedBrand === "all" ? "/brand/mcdonald" : `/brand/${selectedBrand}`}
          className="mt-6 flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-sm font-semibold shadow-sm ring-1 ring-border/60 transition hover:ring-primary/30"
        >
          <span>
            브랜드 전체 메뉴
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              신메뉴 말고 다 보기 · 4개 브랜드
            </span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
