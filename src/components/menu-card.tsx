import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/brand-mark";
import { MenuImage } from "@/components/menu-image";
import { ENDING_SOON_DAYS, daysUntil } from "@/lib/menu-rules";
import { formatMonthDay, formatPrice } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { MenuGroup } from "@/types";

interface MenuCardProps {
  group: MenuGroup;
  /** grid: 2열 카드 · rail: "이번 주" 가로 레일의 큰 카드 (출시일 스탬프 포함) · mini: 상세 하단 가로 목록 */
  variant?: "grid" | "rail" | "mini";
  priority?: boolean;
}

/**
 * 카드 문법은 유지(이미지가 카드를 채우고, 아래로 흰 막, 그 위에 브랜드 마크와 제목)하되 내용 규칙을 바꿨다.
 *  - 설명·별점·NEW 뱃지 없음. 홈 첫 블록은 전부 신메뉴라 NEW 는 정보가 아니다
 *  - 오른쪽 위엔 종료일만. 7일 이내면 "곧 종료"
 *  - 메타는 하나: 종료일 > 가격 > 없음. 없는 값은 자리도 없다
 *  - 브랜드는 로고 원형 마크만. 이름은 접근성 텍스트 (docs/legal/brand-mark-policy.md 예외 항목)
 */
export function MenuCard({ group, variant = "grid", priority = false }: MenuCardProps) {
  const menu = group.representative;
  const isRail = variant === "rail";
  const isMini = variant === "mini";
  const endsIn = menu.end_date ? daysUntil(menu.end_date) : null;
  const endingSoon = endsIn !== null && endsIn <= ENDING_SOON_DAYS;

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-3xl bg-menu-image-matte shadow-sm ring-1 ring-border/60",
        "transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30",
        isRail && "aspect-square w-3/4 shrink-0 snap-start",
        isMini && "aspect-[4/5] w-36 shrink-0 snap-start",
        !isRail && !isMini && "aspect-[4/5] w-full",
      )}
    >
      {/* 하단 오버레이 영역을 비워 두려고 이미지 박스를 위쪽에 잡는다 */}
      <div className={cn("absolute inset-x-3 top-3", isRail ? "bottom-24" : "bottom-20")}>
        <MenuImage
          src={menu.image_url}
          alt={group.name}
          sizes={isRail ? "(max-width: 768px) 75vw, 360px" : "(max-width: 768px) 50vw, 25vw"}
          priority={priority}
          className="object-top drop-shadow-md"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-card/90"
        aria-hidden
      />

      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        {isRail && group.date ? (
          <span className="rounded-md bg-foreground px-2 py-0.5 font-mono text-xs font-semibold text-background">
            {formatMonthDay(group.date)} 출시
          </span>
        ) : (
          <span />
        )}
        {menu.end_date && (
          <Badge
            variant={endingSoon ? "default" : "outline"}
            className={cn(
              "text-xs font-semibold backdrop-blur-sm",
              endingSoon
                ? "border-transparent bg-destructive text-white"
                : "border-black/15 bg-white/85 text-foreground",
            )}
          >
            {endingSoon ? "곧 종료 · " : ""}
            {formatMonthDay(menu.end_date)}까지
          </Badge>
        )}
      </div>

      <div className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 pt-10", isRail && "p-4 pt-12")}>
        <BrandMark brand={group.brand} variant="badge" />
        <h3
          className={cn(
            "line-clamp-2 font-bold leading-tight tracking-tight text-foreground",
            isRail ? "text-2xl" : isMini ? "text-sm" : "text-base",
          )}
        >
          {group.name}
        </h3>
        {!menu.end_date && menu.price_single && (
          <p className={cn("tabular-nums text-muted-foreground", isRail ? "text-sm" : "text-xs")}>
            {formatPrice(menu.price_single)}
          </p>
        )}
      </div>
    </Link>
  );
}
