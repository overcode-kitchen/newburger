"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/error-state";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MenuDetailError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <ErrorState
        title="메뉴 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        digest={error.digest}
        onRetry={reset}
      />
    </main>
  );
}
