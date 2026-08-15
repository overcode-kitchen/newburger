import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { BRANDS, BRAND_CHIP_STYLES } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types";

interface BrandChipsProps {
  selected: Brand | "all";
  /** 칩이 링크할 경로. 홈은 "/", 브랜드 페이지는 "/brand" */
  basePath?: string;
}

function toHref(basePath: string, brand: Brand | "all"): string {
  if (basePath === "/") return brand === "all" ? "/" : `/?brand=${brand}`;
  return brand === "all" ? "/" : `${basePath}/${brand}`;
}

/**
 * 브랜드 필터. 기억하지 않는 단순 필터 — 브랜드가 4개인 동안 개인화는 칩 하나 누르는 것보다 느리다.
 * 활성 칩은 브랜드 원색으로 채워 "지금 버거킹만 보고 있다"를 확실히 한다.
 */
export function BrandChips({ selected, basePath = "/" }: BrandChipsProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none]">
      <div className="flex w-max items-center gap-2">
        <Button
          size="sm"
          variant={selected === "all" ? "default" : "outline"}
          className="shrink-0 rounded-full"
          render={<Link href={toHref(basePath, "all")} />}
        >
          전체
        </Button>
        {BRANDS.map((brand) => (
          <Button
            key={brand}
            size="sm"
            variant="outline"
            className={cn(
              "shrink-0 rounded-full border font-semibold",
              selected === brand ? BRAND_CHIP_STYLES[brand].active : BRAND_CHIP_STYLES[brand].inactive,
            )}
            render={<Link href={toHref(basePath, brand)} />}
          >
            <BrandMark brand={brand} />
          </Button>
        ))}
      </div>
    </div>
  );
}
