import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ReviewRatingInput } from "@/components/review-rating-input";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getMenuById, getReviewsByMenuId, hasSupabaseEnv } from "@/lib/menu-data";
import {
  BRAND_LABELS,
  BRAND_LOGOS,
  formatDate,
  formatPrice,
  isNewMenu,
} from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { MenuWithStats } from "@/types";
import { createReview } from "./actions";

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

function MenuDetailBrandChip({ brand }: { brand: MenuWithStats["brand"] }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border border-black/15 sm:max-w-56",
        "bg-white/85 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm",
      )}
    >
      <Image
        src={BRAND_LOGOS[brand].src}
        alt=""
        width={BRAND_LOGOS[brand].width}
        height={BRAND_LOGOS[brand].height}
        className="h-3 w-auto shrink-0 opacity-90"
        aria-hidden
      />
      <span className="truncate">{BRAND_LABELS[brand]}</span>
    </span>
  );
}

function formatPriceLabel(price: number | null | undefined): string {
  if (typeof price !== "number" || price <= 0) return "가격 정보 준비 중";
  return formatPrice(price);
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const { id } = await params;
  const menu = await getMenuById(id);
  const reviews = await getReviewsByMenuId(id);

  if (!menu && hasSupabaseEnv) notFound();

  if (!hasSupabaseEnv) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
          Supabase 환경변수가 비어있습니다. `.env.local` 값을 채운 뒤 다시
          시도해 주세요.
        </p>
      </main>
    );
  }

  if (!menu) return notFound();

  const imageSrc = menu.image_url?.trim() ?? "";
  const hasImage = imageSrc.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>

      <Card className="overflow-hidden rounded-3xl border-border/70">
        <div className="relative aspect-[4/3] bg-muted sm:aspect-[16/9]">
          {hasImage ? (
            <Image
              src={imageSrc}
              alt={menu.name}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-muted" aria-hidden />
          )}

          <div className="absolute left-0 right-0 top-0 z-30 flex items-start justify-end gap-1 p-4">
            {menu.is_limited && (
              <Badge
                variant="outline"
                className="border-black/20 bg-white/85 text-xs text-foreground backdrop-blur-sm"
              >
                한정
              </Badge>
            )}
            {isNewMenu(menu.release_date) && (
              <Badge className="border-black/10 bg-white/95 text-xs text-foreground">NEW</Badge>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-30 space-y-3 bg-gradient-to-t from-background/92 via-background/55 to-transparent p-5 pt-20 sm:p-6 sm:pt-24">
            <MenuDetailBrandChip brand={menu.brand} />
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {menu.name}
            </h1>
            {menu.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">{menu.description}</p>
            ) : null}
            <p className="text-sm text-foreground/85">
              ★ {menu.average_rating.toFixed(1)}
              <span className="ml-1 text-muted-foreground">({menu.review_count})</span>
            </p>
          </div>
        </div>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl border-border/70 bg-muted/30">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">단품</p>
                <p className="text-xl font-semibold">{formatPriceLabel(menu.price_single)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-muted/30">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">세트</p>
                <p className="text-xl font-semibold">{formatPriceLabel(menu.price_set)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-muted/30">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">출시일</p>
                <p className="text-base font-semibold">{formatDate(menu.release_date)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-muted/30">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">평균 별점</p>
                <p className="text-base font-semibold">
                  ★ {menu.average_rating.toFixed(1)} ({menu.review_count}개)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="rounded-2xl border-border/70">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">판매 기간</p>
                <p className="text-sm font-medium">
                  {menu.end_date ? `${formatDate(menu.release_date)} ~ ${formatDate(menu.end_date)}` : "상시 판매"}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">칼로리</p>
                <p className="text-sm font-medium">
                  {menu.calories ? `${menu.calories} kcal` : "정보 없음"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            {menu.official_link && (
              <Button
                render={<a href={menu.official_link} target="_blank" rel="noopener noreferrer" />}
              >
                공식 링크
              </Button>
            )}
            <ShareButton title={menu.name} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
      <Card className="rounded-3xl border-border/70 p-5 sm:p-6">
        <CardTitle className="mb-4 text-lg">후기 작성</CardTitle>
        <form action={createReview} className="space-y-4">
          <input type="hidden" name="menu_id" value={menu.id} />
          <ReviewRatingInput name="rating" />
          <div className="space-y-1">
            <label htmlFor="comment" className="text-sm font-medium">
              후기 (선택)
            </label>
            <textarea
              id="comment"
              name="comment"
              maxLength={500}
              rows={4}
              placeholder="맛, 양, 재구매 의사 등을 자유롭게 남겨주세요."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">후기 등록</Button>
        </form>
      </Card>

      <Card className="rounded-3xl border-border/70 p-5 sm:p-6">
        <CardTitle className="mb-4 text-lg">후기 피드 {reviews.length}개</CardTitle>
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <p className="font-medium">★ {review.rating}</p>
                <p className="text-muted-foreground">
                  {new Date(review.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.comment || "텍스트 후기는 없습니다."}
              </p>
            </article>
          ))}
          {reviews.length === 0 && (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              아직 작성된 후기가 없습니다.
            </p>
          )}
        </div>
      </Card>
      </div>
    </main>
  );
}
