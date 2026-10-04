import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo-mark";

interface SiteHeaderProps {
  /** 오른쪽 자리. 갱신 시각·기록 아이콘 등 */
  right?: ReactNode;
}

/** 한 줄 헤더. sticky 아님 — 점심 직전 10초에 헤더가 자리를 차지할 이유가 없다 */
export function SiteHeader({ right }: SiteHeaderProps) {
  return (
    <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
        <LogoMark />
        뉴버거
      </Link>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
