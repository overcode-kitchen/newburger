"use client";

import Image from "next/image";
import { BottomSheet } from "@/components/bottom-sheet";
import { DEFAULT_MENU_IMAGE } from "@/components/menu-image";
import { Button } from "@/components/ui/button";
import type { JarSticker } from "@/lib/records";
import { cn } from "@/lib/utils";

interface JarSheetProps {
  open: boolean;
  onClose: () => void;
  stickers: JarSticker[];
  /** 방금 떨어뜨릴 스티커의 recordId — 낙하 연출 */
  dropping?: string | null;
}

/** 병 안 배치. 바닥부터 차곡차곡, 각도만 조금씩 — 위치가 매번 바뀌면 "내 병"이 아니라 남의 병처럼 보인다 */
function slot(i: number, total: number) {
  // 가득 찰수록 작게 (결정 3: 스티커 축소). 12개까지 28%, 그 뒤로 줄어들어 최소 18%
  const size = Math.max(18, 28 - Math.max(0, total - 12) * 0.8);
  const perRow = Math.floor(84 / size);
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const jitter = ((i * 7919) % 11) - 5;
  return {
    size,
    x: 8 + col * size + (row % 2 ? size / 2 : 0) + jitter * 0.4,
    y: 86 - size - row * size * 0.9,
    r: jitter * 2.2,
  };
}

export function JarSheet({ open, onClose, stickers, dropping = null }: JarSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} label="내 병" className="bg-jar-paper">
      <p className="text-center text-lg font-bold">
        내 병 · <span className="tabular-nums">{stickers.length}</span>개
      </p>
      <p className="text-center text-sm text-muted-foreground">도전할 때마다 하나씩 쌓여요</p>

      <div className="relative mx-auto mt-2 aspect-[13/17] w-64 max-w-full">
        <svg viewBox="0 0 260 340" className="absolute inset-0 size-full" aria-hidden>
          <path d="M90 14h80v22H90z" className="fill-foreground/70" />
          <path
            d="M70 40h120c8 0 14 6 14 14v240c0 18-14 32-32 32H88c-18 0-32-14-32-32V54c0-8 6-14 14-14z"
            className="fill-white/55 stroke-foreground/20"
            strokeWidth="3"
          />
          <path d="M78 70v210" className="stroke-white/90" strokeWidth="6" strokeLinecap="round" />
        </svg>
        {stickers.map((s, i) => {
          const p = slot(i, stickers.length);
          return (
            <div
              key={s.recordId}
              title={s.name}
              className={cn(
                "absolute flex items-center justify-center",
                dropping === s.recordId && "animate-sticker-drop",
              )}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}%`, aspectRatio: "1", "--r": `${p.r}deg`, transform: `rotate(${p.r}deg)` } as React.CSSProperties}
            >
              {s.kind === "photo" ? (
                <span className="relative block size-full overflow-hidden rounded-full border-4 border-white shadow-md">
                  <Image src={s.image ?? DEFAULT_MENU_IMAGE} alt={s.name} fill unoptimized className="object-cover" />
                </span>
              ) : (
                <Image
                  src={s.image ?? DEFAULT_MENU_IMAGE}
                  alt={s.name}
                  width={160}
                  height={160}
                  unoptimized={!s.image}
                  className="sticker-cut size-full object-contain"
                />
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" className="mt-3 h-12 w-full rounded-2xl bg-card" onClick={onClose}>
        닫기
      </Button>
    </BottomSheet>
  );
}
