"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <ErrorState
        title="페이지를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요. 계속 반복되면 데이터 연결 상태를 확인해 주세요."
        digest={error.digest}
        onRetry={reset}
      />
    </main>
  );
}
