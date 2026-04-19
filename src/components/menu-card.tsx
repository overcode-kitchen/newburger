import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BRAND_LABELS, BRAND_LOGOS, isNewMenu } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { MenuWithStats } from "@/types";

interface MenuCardProps {
  menu: MenuWithStats;
  imageFit?: "cover" | "contain";
  imagePosition?: "center" | "top";
  cardAspect?: "3/4" | "4/5";
}

function MenuCardBrandChip({ brand }: { brand: MenuWithStats["brand"] }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border border-black/15 sm:max-w-56",
        "bg-white/80 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm",
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

export function MenuCard({
  menu,
  imageFit = "cover",
  imagePosition = "top",
  cardAspect = "3/4",
}: MenuCardProps) {
  const sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw";
  const imageSrc = menu.image_url?.trim() ?? "";
  const hasImage = imageSrc.length > 0;
  const fitClass = imageFit === "contain" ? "object-contain" : "object-cover";
  const positionClass = imagePosition === "top" ? "object-top" : "object-center";
  const aspectClass = cardAspect === "4/5" ? "aspect-[4/5]" : "aspect-[3/4]";

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={cn(
        "group relative block w-full overflow-hidden rounded-3xl shadow-sm ring-1 ring-border/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20",
        aspectClass,
        imageFit === "contain" && hasImage ? "bg-menu-image-matte" : undefined,
      )}
    >
      {hasImage ? (
        <Image
          src={imageSrc}
          alt={menu.name}
          fill
          sizes={sizes}
          className={cn(
            "z-0",
            fitClass,
            positionClass,
            imageFit === "contain" ? "bg-menu-image-matte" : undefined,
          )}
          priority={false}
        />
      ) : (
        <div
          className="absolute inset-0 z-0 bg-muted"
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-transparent via-white/30 to-white/80"
        aria-hidden
      />

      {(menu.is_limited || isNewMenu(menu.release_date)) && (
        <div className="absolute left-0 right-0 top-0 z-[25] flex items-start justify-end gap-1 p-3">
          {menu.is_limited && (
            <Badge
              variant="outline"
              className="border-black/20 bg-white/85 text-xs text-foreground backdrop-blur-sm"
            >
              한정
            </Badge>
          )}
          {isNewMenu(menu.release_date) && (
            <Badge className="border-black/10 bg-white/95 text-xs text-foreground">
              NEW
            </Badge>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-30 space-y-2 p-4 pt-12">
        <MenuCardBrandChip brand={menu.brand} />
        <h2 className="line-clamp-2 text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
          {menu.name}
        </h2>
        {menu.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">
            {menu.description}
          </p>
        ) : null}
        <p className="text-sm text-foreground/85">
          ★ {menu.average_rating.toFixed(1)}
          <span className="ml-1 text-muted-foreground">({menu.review_count})</span>
        </p>
      </div>
    </Link>
  );
}
