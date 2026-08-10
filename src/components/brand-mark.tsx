import Image from "next/image";
import { BRAND_INITIALS, BRAND_LABELS, BRAND_LOGOS } from "@/lib/newburger";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types";

/**
 * 브랜드 로고를 그리는 유일한 곳. docs/legal/brand-mark-policy.md
 * 브랜드 측 요청이 오면 NEXT_PUBLIC_BRAND_MARK 하나로 당일 전환한다: logo → initial → text.
 * initial 은 뉴버거 자체 팔레트로만 그린다 — 브랜드 색으로 만든 이니셜은 로고를 흉내 낸 것으로 보여 안전판이 못 된다.
 */
type BrandMarkMode = "logo" | "initial" | "text";

const MODE: BrandMarkMode = (() => {
  const v = process.env.NEXT_PUBLIC_BRAND_MARK;
  return v === "initial" || v === "text" ? v : "logo";
})();

interface BrandMarkProps {
  brand: Brand;
  /** badge: 카드 위 흰 유리 원 (로고만, 이름은 접근성 텍스트) · inline: 로고 + 이름 (칩·상세·브랜드 페이지) */
  variant?: "badge" | "inline";
  /** inline 전용. 브랜드 페이지 헤더는 정책상 24px 이하 */
  size?: "sm" | "md";
  className?: string;
}

export function BrandMark({ brand, variant = "inline", size = "sm", className }: BrandMarkProps) {
  const label = BRAND_LABELS[brand];

  if (variant === "badge") {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
          "border border-black/10 bg-white/90 shadow-sm backdrop-blur-sm",
          className,
        )}
      >
        <BrandGlyph brand={brand} sizeClass="size-6" />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <BrandGlyph brand={brand} sizeClass={size === "md" ? "size-6" : "size-4"} />
      <span>{label}</span>
    </span>
  );
}

function BrandGlyph({ brand, sizeClass }: { brand: Brand; sizeClass: string }) {
  if (MODE === "text") return null;

  if (MODE === "initial") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold leading-none text-foreground",
          sizeClass,
        )}
      >
        {BRAND_INITIALS[brand]}
      </span>
    );
  }

  const logo = BRAND_LOGOS[brand];
  return (
    <Image
      src={logo.src}
      alt=""
      aria-hidden
      width={logo.width}
      height={logo.height}
      className={cn("shrink-0 object-contain", sizeClass)}
    />
  );
}
