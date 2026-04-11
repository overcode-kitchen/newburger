"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      alert("링크 복사에 실패했습니다.");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy} aria-label={`${title} 링크 공유`}>
      {copied ? "복사 완료!" : "공유하기"}
    </Button>
  );
}
