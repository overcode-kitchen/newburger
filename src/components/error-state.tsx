"use client";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  description: string;
  /** Next.js error boundary가 넘겨주는 식별자. 문의 시 대조용 */
  digest?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title,
  description,
  digest,
  onRetry,
  retryLabel = "다시 시도",
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5 rounded-full"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
      {digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground/70">오류 코드 {digest}</p>
      )}
    </div>
  );
}
