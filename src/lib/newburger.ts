import type { Brand, SortOption } from "@/types";

export const BRANDS: ReadonlyArray<Brand> = [
  "mcdonald",
  "burgerking",
  "lotteria",
  "moms",
];

export const BRAND_LABELS: Record<Brand, string> = {
  mcdonald: "맥도날드",
  burgerking: "버거킹",
  lotteria: "롯데리아",
  moms: "맘스터치",
};

export const BRAND_LOGOS: Record<
  Brand,
  { src: string; width: number; height: number; alt: string }
> = {
  mcdonald: {
    src: "/brands/mcdonald.png",
    width: 500,
    height: 500,
    alt: "맥도날드 로고",
  },
  burgerking: {
    src: "/brands/burgerking.png",
    width: 500,
    height: 500,
    alt: "버거킹 로고",
  },
  lotteria: {
    src: "/brands/lotteria.png",
    width: 500,
    height: 500,
    alt: "롯데리아 로고",
  },
  moms: {
    src: "/brands/moms.png",
    width: 500,
    height: 500,
    alt: "맘스터치 로고",
  },
};

export const BRAND_CHIP_STYLES: Record<
  Brand,
  { active: string; inactive: string; subtle: string }
> = {
  mcdonald: {
    active: "bg-[#da291c] text-white border-[#da291c]",
    inactive: "border-[#da291c]/40 text-[#8f1c14] hover:bg-[#da291c]/10",
    subtle: "bg-[#da291c]/10 text-[#8f1c14] border-[#da291c]/30",
  },
  burgerking: {
    active: "bg-[#ec6a00] text-white border-[#ec6a00]",
    inactive: "border-[#ec6a00]/40 text-[#9a4500] hover:bg-[#ec6a00]/10",
    subtle: "bg-[#ec6a00]/10 text-[#9a4500] border-[#ec6a00]/30",
  },
  lotteria: {
    active: "bg-[#d71920] text-white border-[#d71920]",
    inactive: "border-[#d71920]/40 text-[#8e1418] hover:bg-[#d71920]/10",
    subtle: "bg-[#d71920]/10 text-[#8e1418] border-[#d71920]/30",
  },
  moms: {
    active: "bg-[#c8102e] text-white border-[#c8102e]",
    inactive: "border-[#c8102e]/40 text-[#840c1f] hover:bg-[#c8102e]/10",
    subtle: "bg-[#c8102e]/10 text-[#840c1f] border-[#c8102e]/30",
  },
};

export const SORT_OPTIONS: ReadonlyArray<SortOption> = ["latest", "popular"];

export function parseBrand(value: string | undefined): Brand | "all" {
  if (!value || value === "all") return "all";
  if (BRANDS.includes(value as Brand)) return value as Brand;
  return "all";
}

export function parseSort(value: string | undefined): SortOption {
  if (!value) return "latest";
  if (SORT_OPTIONS.includes(value as SortOption)) return value as SortOption;
  return "latest";
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

export function formatDate(dateValue: string): string {
  return new Date(dateValue).toLocaleDateString("ko-KR");
}

export function isNewMenu(releaseDate: string): boolean {
  const release = new Date(releaseDate).getTime();
  const diff = Date.now() - release;
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 14;
}
