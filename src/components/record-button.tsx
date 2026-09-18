"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { recordMenu, recordMenuWithPhoto, type RecordResult } from "@/app/menu/[id]/actions";
import { BottomSheet } from "@/components/bottom-sheet";
import { JarSheet } from "@/components/jar-sheet";
import { Button } from "@/components/ui/button";
import { toSquareJpeg } from "@/lib/photo";
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
  "bad-photo": "사진을 올리지 못했어요. 다시 찍어 주세요.",
};

type Step = "choose" | "preview";

/**
 * 상세 하단 바의 [먹었어요]. 기록의 순간은 "먹기 직전" — 그래서 판매 상태와 무관하게 항상 보인다.
 * 사진 찍어서 / 사진 없이 두 갈래. 사진은 기기에서 정사각·JPEG 로 줄여 올린다. "인증"이라는 말은 쓰지 않는다.
 */
export function RecordButton({ menuId, menuName, brand, imageUrl, recorded, stickers }: RecordButtonProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [jarOpen, setJarOpen] = useState(false);
  const [jar, setJar] = useState<JarSticker[]>(stickers);
  const [dropping, setDropping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isRecorded = recorded || jar.some((s) => s.menuId === menuId);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function reset() {
    setStep("choose");
    setPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const blob = await toSquareJpeg(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : ERROR_TEXT["bad-photo"]);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function finish(result: RecordResult, kind: JarSticker["kind"], image: string | null) {
    if (!result.ok || !result.recordId) {
      setError(result.error ? ERROR_TEXT[result.error] : ERROR_TEXT.unavailable);
      return;
    }
    const recordId = result.recordId;
    setJar((prev) => {
      const next = prev.filter((s) => s.recordId !== recordId);
      return [...next, { recordId, menuId, name: menuName, brand, kind, image, createdAt: new Date().toISOString() }];
    });
    if (result.created || kind === "photo") setDropping(recordId);
    close();
    setJarOpen(true);
    router.refresh();
  }

  function submitWithoutPhoto() {
    setError(null);
    startTransition(async () => finish(await recordMenu(menuId), "cut", imageUrl));
  }

  function submitWithPhoto() {
    if (!photo) return;
    setError(null);
    const form = new FormData();
    form.set("menu_id", menuId);
    form.set("photo", photo, "photo.jpg");
    startTransition(async () => {
      const result = await recordMenuWithPhoto(form);
      finish(result, "photo", result.photoUrl ?? preview);
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
          isRecorded
            ? "bg-accent text-foreground ring-1 ring-primary hover:bg-accent"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        {isRecorded ? "✓ 기록됨" : "먹었어요"}
      </Button>

      <JarSheet
        open={jarOpen}
        onClose={() => setJarOpen(false)}
        stickers={jar}
        dropping={dropping}
        onRemoved={(id) => setJar((prev) => prev.filter((s) => s.recordId !== id))}
      />

      <input
        ref={fileRef}
        id={`record-photo-${menuId}`}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <BottomSheet open={open} onClose={close} label={`${menuName} 기록`}>
        {step === "choose" ? (
          <>
            <h3 className="text-lg font-bold">먹었어요!</h3>
            <p className="mt-1 text-sm text-muted-foreground">기록해 두면 병에 모여요.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 rounded-2xl bg-background p-3.5 text-left font-semibold transition hover:bg-muted"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-lg" aria-hidden>
                  📷
                </span>
                <span>
                  사진 찍어서 기록
                  <span className="block text-xs font-normal text-muted-foreground">내가 찍은 사진이 스티커가 돼요</span>
                </span>
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={submitWithoutPhoto}
                className="flex items-center gap-3 rounded-2xl bg-background p-3.5 text-left font-semibold transition hover:bg-muted disabled:opacity-60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-lg text-primary" aria-hidden>
                  ✓
                </span>
                <span>
                  {pending ? "저장 중…" : "사진 없이 기록"}
                  <span className="block text-xs font-normal text-muted-foreground">브랜드 사진 스티커로</span>
                </span>
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              사진은 내 병에만 보관되고, 뉴버거가 메뉴 이미지로 쓸 수 있어요.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold">이렇게 저장할까요?</h3>
            <p className="mt-1 text-sm text-muted-foreground">정사각으로 잘렸어요. 버거가 가운데 오면 좋아요.</p>
            {preview && (
              <div className="relative mt-3 aspect-square overflow-hidden rounded-2xl bg-muted">
                <Image src={preview} alt="찍은 사진 미리보기" fill unoptimized className="object-cover" />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => { reset(); fileRef.current?.click(); }}>
                다시 찍기
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={submitWithPhoto}
                className="h-12 flex-1 rounded-2xl bg-foreground text-base font-bold text-background hover:bg-foreground/90"
              >
                {pending ? "저장 중…" : "저장"}
              </Button>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </BottomSheet>
    </>
  );
}
