import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandChips } from "@/components/brand-chips";
import { BrandMark } from "@/components/brand-mark";
import { MenuCard } from "@/components/menu-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBrandSections } from "@/lib/menu-data";
import { BRAND_LABELS, BRAND_SITES, BRANDS } from "@/lib/newburger";
import type { Brand, MenuGroup } from "@/types";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

function asBrand(value: string): Brand | null {
  return BRANDS.includes(value as Brand) ? (value as Brand) : null;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const brand = asBrand((await params).brand);
  // 루트 loading.tsx 때문에 본문은 스트리밍되어 상태 코드가 200 으로 굳는다. 메타데이터 단계에서 404 를 확정한다
  if (!brand) notFound();
  const label = BRAND_LABELS[brand];
  return {
    title: `${label} 버거 메뉴 · 뉴버거`,
    description: `${label}의 신메뉴와 상시 버거를 한 번에. 뉴버거는 ${label}와 제휴 관계가 없는 비공식 정보 서비스입니다.`,
  };
}

function Section({ id, title, count, groups }: { id: string; title: string; count: string; groups: MenuGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section className="mt-5" aria-labelledby={id}>
      <h2 id={id} className="mb-3 flex items-baseline gap-2 text-lg font-bold tracking-tight">
        {title}
        <span className="font-mono text-xs font-normal text-muted-foreground">{count}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {groups.map((group) => (
          <MenuCard key={group.key} group={group} />
        ))}
      </div>
    </section>
  );
}

/**
 * 브랜드 전체 버거(상시 포함). 예전 홈의 브랜드 탭이 이사 온 곳.
 * 이 페이지만 검색으로 들어오면 "브랜드 공식 페이지"로 오인될 수 있어 헤더 로고는 24px 이하,
 * 바로 아래에 제휴 없음 고지를 둔다 (docs/legal/brand-mark-policy.md).
 */
export default async function BrandPage({ params }: BrandPageProps) {
  const brand = asBrand((await params).brand);
  if (!brand) notFound();

  const label = BRAND_LABELS[brand];
  const { fresh, regular } = await getBrandSections(brand);
  const isEmpty = fresh.length === 0 && regular.length === 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="pb-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <BrandMark brand={brand} size="md" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {label}와 제휴 관계가 없습니다.{" "}
            <a
              href={BRAND_SITES[brand]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2"
            >
              {label}에서 보기 ↗
            </a>
          </p>
        </div>

        <BrandChips selected={brand} basePath="/brand" />

        {isEmpty ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{label} 메뉴를 아직 불러오지 못했어요</p>
            <p className="mt-2 text-sm text-muted-foreground">다음 수집 뒤에 다시 확인해 주세요.</p>
          </div>
        ) : (
          <>
            <Section id="fresh" title="신버거" count={`${fresh.length}`} groups={fresh} />
            <Section id="regular" title="상시 메뉴" count={`${regular.length}`} groups={regular} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
