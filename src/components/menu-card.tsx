import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BRAND_LABELS, BRAND_LOGOS, isNewMenu } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { MenuWithStats } from "@/types";

interface MenuCardProps {
  menu: MenuWithStats;
}

function MenuCardBrandChip({ brand }: { brand: MenuWithStats["brand"] }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[min(100%,14rem)] items-center gap-1 rounded-full border border-white/25",
        "bg-black/35 px-2 py-1 text-xs font-medium text-white/85 backdrop-blur-sm",
      )}
    >
      <Image
        src={BRAND_LOGOS[brand].src}
        alt=""
        width={BRAND_LOGOS[brand].width}
        height={BRAND_LOGOS[brand].height}
        className="h-3 w-auto shrink-0 opacity-90 brightness-0 invert"
        aria-hidden
      />
      <span className="truncate">{BRAND_LABELS[brand]}</span>
    </span>
  );
}

export function MenuCard({ menu }: MenuCardProps) {
  const sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw";

  return (
    <Link
      href={`/menu/${menu.id}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      <Image
        src={menu.image_url}
        alt={menu.name}
        fill
        sizes={sizes}
        className="z-0 object-cover"
        priority={false}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden mask-gradient-b"
        aria-hidden
      >
        <Image
          src={menu.image_url}
          alt=""
          fill
          sizes={sizes}
          className="scale-110 object-cover blur-2xl"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-transparent via-black/35 to-black/78"
        aria-hidden
      />

      {(menu.is_limited || isNewMenu(menu.release_date)) && (
        <div className="absolute left-0 right-0 top-0 z-[25] flex items-start justify-end gap-1 p-3">
          {menu.is_limited && (
            <Badge
              variant="outline"
              className="border-white/45 bg-black/30 text-xs text-white backdrop-blur-sm"
            >
              한정
            </Badge>
          )}
          {isNewMenu(menu.release_date) && (
            <Badge className="border-transparent bg-white/90 text-xs text-foreground">
              NEW
            </Badge>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-30 space-y-2 p-4 pt-12">
        <MenuCardBrandChip brand={menu.brand} />
        <h2 className="line-clamp-2 text-[28px] font-bold leading-snug tracking-tight text-white">
          {menu.name}
        </h2>
        {menu.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-white/75">
            {menu.description}
          </p>
        ) : null}
        <p className="text-sm text-white/80">
          ★ {menu.average_rating.toFixed(1)}
          <span className="ml-1 text-white/65">({menu.review_count})</span>
        </p>
      </div>
    </Link>
  );
}
