import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getMenuById, getReviewsByMenuId, hasSupabaseEnv } from "@/lib/menu-data";
import { BRAND_LABELS, formatDate, formatPrice, isNewMenu } from "@/lib/newburger";
import { createReview } from "./actions";

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>

      <Card className="overflow-hidden">
        <div className="aspect-[16/9] bg-muted">
          <Image
            src={menu.image_url}
            alt={menu.name}
            width={1200}
            height={675}
            className="h-full w-full object-cover"
          />
        </div>
        <CardContent className="space-y-4 p-5 pt-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{BRAND_LABELS[menu.brand]}</span>
            {menu.is_limited && <Badge variant="outline">한정</Badge>}
            {isNewMenu(menu.release_date) && <Badge>NEW</Badge>}
          </div>

          <h1 className="text-2xl font-bold">{menu.name}</h1>
          <p className="text-lg font-semibold">{formatPrice(menu.price)}</p>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>출시일: {formatDate(menu.release_date)}</p>
            <p>판매기간: {menu.end_date ? `~ ${formatDate(menu.end_date)}` : "상시"}</p>
            <p>칼로리: {menu.calories ? `${menu.calories} kcal` : "정보 없음"}</p>
            <p>
              평균 별점: ★ {menu.average_rating.toFixed(1)} ({menu.review_count}개)
            </p>
          </div>

          {menu.description && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {menu.description}
            </p>
          )}

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

      <Card className="mt-8 p-5">
        <CardTitle className="mb-4 text-lg">후기 작성</CardTitle>
        <form action={createReview} className="space-y-4">
          <input type="hidden" name="menu_id" value={menu.id} />
          <div className="space-y-1">
            <label htmlFor="rating" className="text-sm font-medium">
              별점
            </label>
            <select
              id="rating"
              name="rating"
              required
              defaultValue=""
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                별점을 선택하세요
              </option>
              <option value="5">5점</option>
              <option value="4">4점</option>
              <option value="3">3점</option>
              <option value="2">2점</option>
              <option value="1">1점</option>
            </select>
          </div>
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

      <Card className="mt-8 p-5">
        <CardTitle className="mb-4 text-lg">후기 {reviews.length}개</CardTitle>
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border p-3">
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
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              아직 작성된 후기가 없습니다.
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
