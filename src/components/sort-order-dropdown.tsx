"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOption } from "@/types";

interface SortOrderDropdownProps {
  selectedSort: SortOption;
  hrefLatest: string;
  hrefPopular: string;
}

export function SortOrderDropdown({
  selectedSort,
  hrefLatest,
  hrefPopular,
}: SortOrderDropdownProps) {
  const label = selectedSort === "latest" ? "신메뉴순" : "인기순";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-full"
          >
            {label}
            <ChevronDownIcon className="size-4 opacity-70" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[10rem]">
        <DropdownMenuLinkItem
          render={<Link href={hrefLatest} />}
          className={selectedSort === "latest" ? "font-medium" : undefined}
        >
          신메뉴순
        </DropdownMenuLinkItem>
        <DropdownMenuLinkItem
          render={<Link href={hrefPopular} />}
          className={selectedSort === "popular" ? "font-medium" : undefined}
        >
          인기순
        </DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
