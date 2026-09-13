"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

/** 모바일 바텀시트. 배경 탭·Esc 로 닫힌다 */
export function BottomSheet({ open, onClose, label, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-label={label}
        className={cn(
          "relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card px-4 pb-8 pt-2.5 shadow-lg",
          "animate-in slide-in-from-bottom duration-300",
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" aria-hidden />
        {children}
      </div>
    </div>
  );
}
