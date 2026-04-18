import Link from "next/link";
import Image from "next/image";
import { SortOrderDropdown } from "@/components/sort-order-dropdown";
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
  const hrefLatest = toHref(selectedBrand, "latest");
  const hrefPopular = toHref(selectedBrand, "popular");

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x">
        <div className="flex w-max flex-nowrap items-center justify-start gap-2">
        <Button
          size="sm"
          variant={selectedBrand === "all" ? "default" : "outline"}
          className={cn("shrink-0 rounded-full")}
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
              "shrink-0 rounded-full border font-semibold",
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
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <SortOrderDropdown
          selectedSort={selectedSort}
          hrefLatest={hrefLatest}
          hrefPopular={hrefPopular}
        />
      </div>
    </div>
  );
}
