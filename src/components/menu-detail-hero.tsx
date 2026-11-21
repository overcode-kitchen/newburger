import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_LABELS, BRAND_LOGOS, isNewMenu } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { MenuWithStats } from "@/types";

interface MenuDetailHeroProps {
  menu: MenuWithStats;
  className?: string;
  priority?: boolean;
}

function BrandChip({ brand }: { brand: MenuWithStats["brand"] }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border border-black/15 sm:max-w-56",
        "bg-card/85 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm",
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

export function MenuDetailHero({
  menu,
  className,
  priority = true,
}: MenuDetailHeroProps) {
  const imageSrc = menu.image_url?.trim() ?? "";
  const hasImage = imageSrc.length > 0;

  return (
    <Card className={cn("overflow-hidden rounded-3xl border-border/70 bg-card", className)}>
      <div className="relative aspect-[4/3] bg-card">
        {hasImage ? (
          <Image
            src={imageSrc}
            alt={menu.name}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-top"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-card" aria-hidden />
        )}

        <div className="absolute left-0 right-0 top-0 z-30 flex items-start justify-end gap-1 p-4">
          {menu.is_limited && (
            <Badge
              variant="outline"
              className="border-black/20 bg-card/85 text-xs text-foreground backdrop-blur-sm"
            >
              한정
            </Badge>
          )}
          {isNewMenu(menu.release_date) && (
            <Badge className="border-black/10 bg-card/95 text-xs text-foreground">NEW</Badge>
          )}
        </div>
      </div>

      <CardContent className="space-y-3 p-5 sm:p-6">
        <BrandChip brand={menu.brand} />
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          {menu.name}
        </h1>
        {menu.description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {menu.description}
          </p>
        ) : null}
        <p className="text-sm text-foreground">
          ★ {menu.average_rating.toFixed(1)}
          <span className="ml-1 text-muted-foreground">({menu.review_count})</span>
        </p>
      </CardContent>
    </Card>
  );
}
