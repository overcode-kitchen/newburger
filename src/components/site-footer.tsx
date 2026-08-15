import Link from "next/link";

/** 비공식 고지. 첫 화면 한 줄(홈 상단)과 함께 정책상 필수 — docs/legal/brand-mark-policy.md */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 text-xs leading-relaxed text-muted-foreground sm:px-6 lg:px-8">
      <p>
        뉴버거는 각 브랜드와 제휴·후원 관계가 없는 비공식 정보 서비스입니다. 메뉴 정보와 이미지의 출처는 각
        브랜드 웹사이트이며, 가격은 변동될 수 있어요.{" "}
        <Link href="/about" className="underline underline-offset-2">
          소개
        </Link>
      </p>
    </footer>
  );
}
