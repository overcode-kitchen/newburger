import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { HeaderJar } from "@/components/header-jar";
import { MenuCard } from "@/components/menu-card";
import { MenuImage } from "@/components/menu-image";
import { RecordButton } from "@/components/record-button";
import { ShareButton } from "@/components/share-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getClientId } from "@/lib/client-id";
import { getMenuGroupById, hasSupabaseEnv } from "@/lib/menu-data";
import { ENDING_SOON_DAYS, daysUntil, effectiveDate, effectivePrice } from "@/lib/menu-rules";
import { BRAND_LABELS, BRAND_SITES, formatMonthDay, formatMonthLabel, formatPrice } from "@/lib/newburger";
import { countGroupRecords, findMyRecord, getMyJar, getRecordStats } from "@/lib/records";
import { cn } from "@/lib/utils";

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MenuDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const lookup = hasSupabaseEnv ? await getMenuGroupById(id) : null;
  if (!lookup) return {};
  const { group } = lookup;
  return {
    title: `${group.name} · ${BRAND_LABELS[group.brand]} · 뉴버거`,
    description: group.representative.description ?? `${BRAND_LABELS[group.brand]} ${group.name}`,
  };
}

/**
 * 상세 = "갈지 말지 3초 판단 → 브랜드로 보냄 → 먹기 직전에 기록".
 * 있는 정보만 그린다 — 없는 값에 "정보 없음" 라벨을 만들지 않는다. 가격 없는 브랜드는 가격 블록 자체가 없다.
 * "공식" 이라는 단어는 쓰지 않는다 (docs/legal/brand-mark-policy.md).
 */
export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const { id } = await params;
  if (!hasSupabaseEnv) notFound();

  const lookup = await getMenuGroupById(id);
  if (!lookup) notFound();
  // 세트 같은 변형 행 id 로 들어오면 대표 행으로. 기록·공유 링크가 한 곳에 모이게
  if (lookup.isVariant) redirect(`/menu/${lookup.group.representative.id}`);

  const { group, siblings } = lookup;
  const menu = group.representative;
  const label = BRAND_LABELS[group.brand];

  const [clientId, stats] = await Promise.all([getClientId(), getRecordStats()]);
  const [myRecord, jar] = await Promise.all([findMyRecord(clientId, menu.id), getMyJar(clientId)]);
  const recordCount = countGroupRecords(stats, group.members.map((m) => m.id));

  const date = effectiveDate(menu);
  const endsIn = menu.end_date ? daysUntil(menu.end_date) : null;
  const status = !menu.is_active
    ? { text: "판매 종료", tone: "muted" as const }
    : endsIn !== null && endsIn <= ENDING_SOON_DAYS
      ? { text: `곧 종료 · ${formatMonthDay(menu.end_date ?? "")}까지`, tone: "danger" as const }
      : menu.end_date
        ? { text: `${formatMonthDay(menu.end_date)}까지`, tone: "outline" as const }
        : { text: "판매 중", tone: "outline" as const };

  // 큐레이션 가격이 있으면 그것이 유일한 출처다 (맥도날드·맘스터치). 세트는 묶음 변형과 큐레이션 둘 다에서 올 수 있다
  const price = effectivePrice(menu);
  const setLines =
    group.variants.length > 0
      ? group.variants.map((v) => `${v.label} ${formatPrice(v.price ?? 0)}`)
      : price.set
        ? [`세트 ${formatPrice(price.set)}`]
        : [];
  const priceLine = [price.single ? formatPrice(price.single) : null, ...setLines].filter(Boolean);
  const hasInfo = priceLine.length > 0 || Boolean(menu.calories_text);

  return (
    <>
      <SiteHeader
        right={
          <>
            <ShareButton title={group.name} />
            <HeaderJar />
          </>
        }
      />
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 pb-28 sm:px-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-menu-image-matte">
          <div className="absolute inset-4">
            <MenuImage src={menu.image_url} alt={group.name} sizes="(max-width: 768px) 100vw, 672px" priority className="drop-shadow-lg" />
          </div>
          <Badge
            variant={status.tone === "outline" ? "outline" : "default"}
            className={cn(
              "absolute right-3 top-3 text-xs font-semibold backdrop-blur-sm",
              status.tone === "outline" && "border-black/15 bg-white/85 text-foreground",
              status.tone === "danger" && "border-transparent bg-destructive text-white",
              status.tone === "muted" && "border-transparent bg-foreground/80 text-background",
            )}
          >
            {status.text}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <BrandMark brand={group.brand} className="font-semibold text-foreground" />
          {date && (
            <>
              <span aria-hidden>·</span>
              <span>
                {formatMonthDay(date)} {menu.release_date || menu.curated_release_date ? "출시" : "확인"}
              </span>
            </>
          )}
          {menu.is_limited && (
            <>
              <span aria-hidden>·</span>
              <span>한정</span>
            </>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight">{group.name}</h1>
        {menu.curated_availability && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-sm text-foreground">
            <span aria-hidden>📍</span>
            {menu.curated_availability}
          </p>
        )}
        {myRecord && <p className="mt-2 text-sm font-semibold text-primary">✓ 먹어봤어요 · 병에 있어요</p>}

        {hasInfo && (
          <dl className="mt-4 divide-y divide-border rounded-2xl bg-card px-4 shadow-sm ring-1 ring-border/60">
            {priceLine.length > 0 && (
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="shrink-0 text-muted-foreground">가격</dt>
                <dd className="text-right tabular-nums">{priceLine.join(" · ")}</dd>
              </div>
            )}
            {menu.calories_text && (
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="shrink-0 text-muted-foreground">칼로리</dt>
                <dd className="text-right tabular-nums">{menu.calories_text} kcal</dd>
              </div>
            )}
          </dl>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {priceLine.length === 0
            ? `가격은 ${label}에서 확인해 주세요`
            : price.source === "curated" && price.checkedOn
              ? `${formatMonthLabel(price.checkedOn)} 기준 · 일부 매장 가격이라 매장에 따라 다를 수 있어요`
              : "가격은 변동될 수 있어요 · 매장에서 확인해 주세요"}
        </p>

        {menu.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{menu.description}</p>}

        {recordCount > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">{recordCount}명</strong>이 도전했어요
          </p>
        )}

        {siblings.length > 0 && (
          <section className="mt-8" aria-labelledby="siblings">
            <h2 id="siblings" className="mb-3 text-base font-bold tracking-tight">
              {label}의 다른 신버거
            </h2>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6">
              {siblings.map((s) => (
                <MenuCard key={s.key} group={s} variant="mini" />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent pb-[max(env(safe-area-inset-bottom),1rem)] pt-6">
        <div className="mx-auto flex w-full max-w-2xl gap-2 px-4 sm:px-6">
          <a
            href={menu.official_link ?? BRAND_SITES[group.brand]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {label}에서 보기 ↗
          </a>
          <RecordButton
            menuId={menu.id}
            menuName={group.name}
            brand={group.brand}
            imageUrl={menu.image_url}
            recorded={Boolean(myRecord)}
            stickers={jar}
          />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
