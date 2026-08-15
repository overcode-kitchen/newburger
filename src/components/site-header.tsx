import Link from "next/link";
import type { ReactNode } from "react";

interface SiteHeaderProps {
  /** 오른쪽 자리. 갱신 시각·기록 아이콘 등 */
  right?: ReactNode;
}

/** 한 줄 헤더. sticky 아님 — 점심 직전 10초에 헤더가 자리를 차지할 이유가 없다 */
export function SiteHeader({ right }: SiteHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-1 pt-3 sm:px-6 lg:px-8">
      <Link href="/" className="text-xl font-bold tracking-tight">
        뉴버거
        <span className="ml-0.5 inline-block size-2 rounded-full bg-primary align-[2px]" aria-hidden />
      </Link>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
