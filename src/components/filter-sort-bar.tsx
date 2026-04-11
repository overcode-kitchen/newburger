import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  BRANDS,
  BRAND_CHIP_STYLES,
  BRAND_LABELS,
  BRAND_LOGOS,
} from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { Brand, SortOption } from "@/types";

interface FilterSortBarProps {
  selectedBrand: Brand | "all";
  selectedSort: SortOption;
}

function toHref(brand: Brand | "all", sort: SortOption): string {
  const params = new URLSearchParams();
  if (brand !== "all") params.set("brand", brand);
  if (sort !== "latest") params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function FilterSortBar({
  selectedBrand,
  selectedSort,
}: FilterSortBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedBrand === "all" ? "default" : "outline"}
          className={cn("rounded-full")}
          render={<Link href={toHref("all", selectedSort)} />}
        >
          전체
        </Button>
        {BRANDS.map((brand) => (
          <Button
            key={brand}
            size="sm"
            variant="outline"
            className={cn(
              "rounded-full border font-semibold",
              selectedBrand === brand
                ? BRAND_CHIP_STYLES[brand].active
                : BRAND_CHIP_STYLES[brand].inactive,
            )}
            render={<Link href={toHref(brand, selectedSort)} />}
          >
            <span className="inline-flex items-center gap-1.5">
              <Image
                src={BRAND_LOGOS[brand].src}
                alt={BRAND_LOGOS[brand].alt}
                width={BRAND_LOGOS[brand].width}
                height={BRAND_LOGOS[brand].height}
                className="h-4 w-auto object-contain"
              />
              <span>{BRAND_LABELS[brand]}</span>
            </span>
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedSort === "latest" ? "default" : "outline"}
          render={<Link href={toHref(selectedBrand, "latest")} />}
        >
          신메뉴순
        </Button>
        <Button
          size="sm"
          variant={selectedSort === "popular" ? "default" : "outline"}
          render={<Link href={toHref(selectedBrand, "popular")} />}
        >
          인기순
        </Button>
      </div>
    </div>
  );
}
