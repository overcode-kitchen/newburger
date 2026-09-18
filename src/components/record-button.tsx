"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordMenu, type RecordResult } from "@/app/menu/[id]/actions";
import { BottomSheet } from "@/components/bottom-sheet";
import { JarSheet } from "@/components/jar-sheet";
import { Button } from "@/components/ui/button";
import type { JarSticker } from "@/lib/records";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types";

interface RecordButtonProps {
  menuId: string;
  menuName: string;
  brand: Brand;
  imageUrl: string | null;
  /** 이미 기록돼 있으면 "✓ 기록됨". 다시 누르면 병이 열린다 */
  recorded: boolean;
  /** 내 병 (서버에서). 기록 직후엔 여기에 새 스티커를 붙여 서버 왕복 없이 바로 떨어뜨린다 */
  stickers: JarSticker[];
}

const ERROR_TEXT: Record<NonNullable<RecordResult["error"]>, string> = {
  "no-client": "브라우저 설정 때문에 기록을 저장할 수 없어요. 쿠키를 허용해 주세요.",
  "daily-limit": "하루에 3개까지만 기록할 수 있어요. 내일 또 도전해요!",
  "not-found": "이 메뉴를 찾을 수 없어요.",
  unavailable: "지금은 기록을 저장할 수 없어요. 잠시 후 다시 시도해 주세요.",
};

/**
 * 상세 하단 바의 [먹었어요]. 기록의 순간은 "먹기 직전" — 그래서 이 버튼은 판매 상태와 무관하게 항상 보인다.
 * 사진 없이 기록만 여기서. 사진 촬영은 다음 단계에서 이 시트에 붙는다.
 */
export function RecordButton({ menuId, menuName, brand, imageUrl, recorded, stickers }: RecordButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jarOpen, setJarOpen] = useState(false);
  const [jar, setJar] = useState<JarSticker[]>(stickers);
  const [dropping, setDropping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isRecorded = recorded || jar.some((s) => s.menuId === menuId);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await recordMenu(menuId);
      if (!result.ok || !result.recordId) {
        setError(result.error ? ERROR_TEXT[result.error] : ERROR_TEXT.unavailable);
        return;
      }
      const recordId = result.recordId;
      if (result.created) {
        setJar((prev) => [
          ...prev,
          { recordId, menuId, name: menuName, brand, kind: "cut", image: imageUrl, createdAt: new Date().toISOString() },
        ]);
        setDropping(recordId);
      }
      setOpen(false);
      setJarOpen(true);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => (isRecorded ? setJarOpen(true) : setOpen(true))}
        className={cn(
          "h-12 flex-1 rounded-2xl text-base font-bold",
          isRecorded ? "bg-accent text-foreground ring-1 ring-primary hover:bg-accent" : "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        {isRecorded ? "✓ 기록됨" : "먹었어요"}
      </Button>

      <JarSheet open={jarOpen} onClose={() => setJarOpen(false)} stickers={jar} dropping={dropping} />

      <BottomSheet open={open} onClose={() => setOpen(false)} label={`${menuName} 기록`}>
        <h3 className="text-lg font-bold">먹었어요!</h3>
        <p className="mt-1 text-sm text-muted-foreground">기록해 두면 병에 모여요.</p>
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={submit}
          className="mt-4 h-12 w-full rounded-2xl bg-foreground text-base font-bold text-background hover:bg-foreground/90"
        >
          {pending ? "저장 중…" : "기록하기"}
        </Button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </BottomSheet>
    </>
  );
}
