import type { Brand } from "@/types";

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

/** 브랜드 대표 페이지. 상세의 official_link 가 없을 때와 브랜드 페이지 헤더의 "○○에서 보기"에 쓴다 */
export const BRAND_SITES: Record<Brand, string> = {
  mcdonald: "https://www.mcdonalds.co.kr/kor/menu/list.do",
  burgerking: "https://www.burgerking.co.kr/menu/all",
  lotteria: "https://www.lotteeatz.com/brand/ria",
  moms: "https://momstouch.co.kr/menu/new.php",
};

/** 로고를 못 쓰게 됐을 때의 이니셜. 브랜드 색 없이 자체 팔레트로만 그린다 (docs/legal/brand-mark-policy.md) */
export const BRAND_INITIALS: Record<Brand, string> = {
  mcdonald: "M",
  burgerking: "BK",
  lotteria: "L",
  moms: "MT",
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

export function parseBrand(value: string | undefined): Brand | "all" {
  if (!value || value === "all") return "all";
  if (BRANDS.includes(value as Brand)) return value as Brand;
  return "all";
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/** "2026-09-22" → "9월". 큐레이션 가격의 기준 시점 표시 */
export function formatMonthLabel(dateValue: string): string {
  return `${Number(dateValue.split("-")[1])}월`;
}

/** "2026-10-21" → "10/21". 카드처럼 좁은 곳용 */
export function formatMonthDay(dateValue: string): string {
  const [, m, d] = dateValue.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** "2026-09-18T07:02:11Z" → "9.18 07:02". 서울 기준 — 배포 환경(UTC)에서 9시간 어긋나지 않게 */
export function formatCrawledAt(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export function formatDate(dateValue: string | null): string {
  if (!dateValue) return "정보 없음";
  return new Date(dateValue).toLocaleDateString("ko-KR");
}
