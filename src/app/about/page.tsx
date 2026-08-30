import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BRAND_LABELS, BRAND_SITES, BRANDS } from "@/lib/newburger";

export const metadata: Metadata = {
  title: "소개 · 뉴버거",
  description: "뉴버거는 국내 햄버거 브랜드 4곳의 신메뉴를 매일 아침 모아 보여주는 비공식 정보 서비스입니다.",
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/** 출처 표기와 면책. 문구는 docs/legal/brand-mark-policy.md 의 고지 문구를 따른다 */
export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight">뉴버거 소개</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          신메뉴가 나오면 도전해 보고 싶은 사람을 위해, 국내 햄버거 브랜드 4곳의 신버거를 매일 아침 한곳에 모읍니다.
          어디서 뭐가 새로 나왔는지 10초 안에 훑고, 마음에 들면 브랜드 페이지로 가서 확인하세요.
        </p>

        <section className="mt-8 space-y-3 text-sm leading-relaxed">
          <h2 className="text-base font-semibold">비공식 서비스입니다</h2>
          <p className="text-muted-foreground">
            뉴버거는 각 햄버거 브랜드와 제휴·후원·협력 관계가 없는 <strong className="text-foreground">비공식 정보 서비스</strong>
            입니다. 메뉴 정보는 각 브랜드 웹사이트에 공개된 내용을 수집한 것으로, 실제 판매 여부·가격·구성은 매장과
            시점에 따라 다를 수 있습니다. 정확한 내용은 각 브랜드에서 확인해 주세요.
          </p>
          <p className="text-muted-foreground">
            이 서비스에 표시된 브랜드명과 로고는 각 권리자의 상표이며, 해당 브랜드의 메뉴임을 나타내기 위한 식별
            목적으로만 사용됩니다. 메뉴 이미지는 저장하지 않고 각 브랜드 웹사이트의 원본을 참조합니다. 권리자의
            요청이 있을 경우 즉시 수정 또는 삭제합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed">
          <h2 className="text-base font-semibold">정보 출처</h2>
          <ul className="space-y-1.5 text-muted-foreground">
            {BRANDS.map((brand) => (
              <li key={brand}>
                {BRAND_LABELS[brand]} ·{" "}
                <a
                  href={BRAND_SITES[brand]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {BRAND_LABELS[brand]} 메뉴 페이지 ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            매일 아침 7시에 각 브랜드 웹사이트를 한 번 확인합니다. 가격은 브랜드가 공개한 경우에만 표시하며 변동될 수
            있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed">
          <h2 className="text-base font-semibold">문의 · 수정 요청</h2>
          <p className="text-muted-foreground">
            잘못된 정보, 삭제 요청, 제휴 문의는{" "}
            {CONTACT ? (
              <a href={`mailto:${CONTACT}`} className="font-medium text-foreground underline underline-offset-2">
                {CONTACT}
              </a>
            ) : (
              <span className="font-medium text-foreground">이메일(준비 중)</span>
            )}
            로 보내 주세요. 영업일 1~2일 안에 답합니다.
          </p>
        </section>

        <p className="mt-10 text-sm">
          <Link href="/" className="font-medium underline underline-offset-2">
            ← 홈으로
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
