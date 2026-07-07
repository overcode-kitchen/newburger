import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">찾는 페이지가 없어요</p>
        <p className="mt-2 text-sm text-muted-foreground">
          주소가 바뀌었거나 메뉴가 내려갔을 수 있어요.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5 rounded-full"
          render={<Link href="/" />}
        >
          홈으로
        </Button>
      </div>
    </main>
  );
}
