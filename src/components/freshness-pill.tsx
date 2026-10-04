import { formatCrawledAt } from "@/lib/newburger";
import { cn } from "@/lib/utils";

interface FreshnessPillProps {
  /** 마지막 수집(확인) 시각 ISO */
  at: string;
  now?: Date;
}

/** 헤더 오른쪽 신선도 칩. 오늘 확인했으면 초록 점, 아니면 회색 점 — "매일 아침 갱신" 약속을 문장 대신 증거로 보여 준다 */
export function FreshnessPill({ at, now }: FreshnessPillProps) {
  const { label, isToday } = formatCrawledAt(at, now);
  return (
    <span
      title="브랜드 사이트를 마지막으로 확인한 시각"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border"
    >
      <span className={cn("size-1.5 rounded-full", isToday ? "bg-primary" : "bg-muted-foreground/50")} aria-hidden />
      {label} 확인
    </span>
  );
}
