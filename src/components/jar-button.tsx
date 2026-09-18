"use client";

import { useState } from "react";
import { JarSheet } from "@/components/jar-sheet";
import type { JarSticker } from "@/lib/records";

/** 헤더의 버거 아이콘 + 개수. 기록이 1개 이상일 때만 렌더된다 — 0개인 병은 보여주지 않는다 */
export function JarButton({ stickers }: { stickers: JarSticker[] }) {
  const [open, setOpen] = useState(false);
  if (stickers.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`내 병, 기록 ${stickers.length}개`}
        className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-1.5 pr-2.5 text-xs font-semibold text-foreground"
      >
        <BurgerIcon />
        <span className="tabular-nums">{stickers.length}</span>
      </button>
      <JarSheet open={open} onClose={() => setOpen(false)} stickers={stickers} />
    </>
  );
}

export function BurgerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "size-5"} aria-hidden>
      <path d="M4 10.5c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5H4z" className="fill-foreground" />
      <circle cx="9" cy="7.6" r=".8" className="fill-background" />
      <circle cx="12.5" cy="6.6" r=".8" className="fill-background" />
      <circle cx="15.5" cy="7.8" r=".8" className="fill-background" />
      <path d="M3.5 12.2h17c.3 0 .5.2.5.5v.6c0 .3-.2.5-.5.5h-17a.5.5 0 0 1-.5-.5v-.6c0-.3.2-.5.5-.5z" className="fill-primary" />
      <rect x="4" y="15" width="16" height="2.2" rx="1.1" className="fill-foreground" />
      <path d="M4 18.6h16v.6c0 1.2-1 2.2-2.2 2.2H6.2C5 21.4 4 20.4 4 19.2v-.6z" className="fill-foreground" />
    </svg>
  );
}
