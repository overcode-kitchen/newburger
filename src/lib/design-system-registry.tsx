import type { ReactNode } from "react";
import Link from "next/link";
import { MenuCard } from "@/components/menu-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MenuWithStats } from "@/types";

const menuCardPreviewSample: MenuWithStats = {
  id: "00000000-0000-4000-8000-000000000001",
  brand: "burgerking",
  name: "통새우 와퍼 스파이시",
  price_single: 8500,
  price_set: 11800,
  image_url:
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=80&auto=format&fit=crop",
  release_date: "2026-04-09",
  end_date: "2026-05-20",
  is_limited: true,
  calories: 730,
  official_link: null,
  description:
    "디자인 시스템 프리뷰용 설명입니다. 카드 하단 그라데이션 위에 두 줄까지 표시됩니다.",
  created_at: "2026-04-01T00:00:00.000Z",
  average_rating: 4.6,
  review_count: 128,
};

const menuCardVariantSamples: ReadonlyArray<{
  label: string;
  description: string;
  overlayVariant: "a" | "c";
}> = [
  {
    label: "A — 전영역 그라데이션 (현재 적용)",
    description: "from-transparent via-white/30 to-white/80 · 중단부터 은은하게 흰 막이 쌓임",
    overlayVariant: "a",
  },
  {
    label: "C — 하단 집중 그라데이션",
    description: "from-transparent from-55% via-white/40 via-80% to-white/92 · 상단은 완전 선명, 하단 45%에만 흰 막",
    overlayVariant: "c",
  },
];

const menuDetailInfoSamples: ReadonlyArray<{ label: string; value: string }> = [
  { label: "단품", value: "8,500원" },
  { label: "세트", value: "11,800원" },
  { label: "출시일", value: "2026. 4. 9." },
  { label: "평균 별점", value: "★ 4.6 (128개)" },
];

export interface DesignPreviewItem {
  name: string;
  sourcePath: string;
  notes?: string;
  render: () => ReactNode;
}

export const designPreviewRegistry: DesignPreviewItem[] = [
  {
    name: "Button",
    sourcePath: "src/components/ui/button.tsx",
    notes: "variant/size를 대표 샘플로 노출",
    render: () => (
      <div className="flex flex-wrap items-center gap-2">
        <Button>기본</Button>
        <Button variant="outline">아웃라인</Button>
        <Button variant="secondary">세컨더리</Button>
        <Button variant="ghost">고스트</Button>
        <Button variant="destructive">삭제</Button>
      </div>
    ),
  },
  {
    name: "DropdownMenu",
    sourcePath: "src/components/ui/dropdown-menu.tsx",
    notes: "Base UI Menu; 트리거 + 링크 항목 예시",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="outline">열기</Button>}
        />
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          <DropdownMenuLinkItem render={<Link href="#" />}>
            첫 번째
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem render={<Link href="#" />}>
            두 번째
          </DropdownMenuLinkItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: "Badge",
    sourcePath: "src/components/ui/badge.tsx",
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Badge>기본</Badge>
        <Badge variant="secondary">보조</Badge>
        <Badge variant="outline">아웃라인</Badge>
        <Badge>강조</Badge>
      </div>
    ),
  },
  {
    name: "Card",
    sourcePath: "src/components/ui/card.tsx",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>카드 타이틀</CardTitle>
          <p className="text-sm text-muted-foreground">카드 설명 텍스트</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            디자인 시스템 카드 프리뷰 예시입니다.
          </p>
          <div className="mt-3">
            <Button size="sm">확인</Button>
          </div>
        </CardContent>
      </Card>
    ),
  },
  {
    name: "MenuCard",
    sourcePath: "src/components/menu-card.tsx",
    notes: "하단 텍스트 가독성용 z-20 흰 그라데이션 변형 비교 프리뷰 (A = 현재 적용 / C = 하단 집중)",
    render: () => (
      <div className="grid gap-4 md:grid-cols-2">
        {menuCardVariantSamples.map((variant) => (
          <div key={variant.label} className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">{variant.label}</p>
              <p className="text-xs text-muted-foreground">{variant.description}</p>
            </div>
            <MenuCard
              menu={menuCardPreviewSample}
              overlayVariant={variant.overlayVariant}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "MenuDetail Patterns",
    sourcePath: "src/app/menu/[id]/page.tsx",
    notes: "상세 페이지 정보카드/후기 피드 UI 패턴",
    render: () => (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {menuDetailInfoSamples.map((item) => (
            <Card key={item.label} className="rounded-2xl border-border/70 bg-muted/30">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-base font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl border-border/70 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <p className="font-medium">★ 5</p>
            <p className="text-muted-foreground">2026. 04. 14. 14:22</p>
          </div>
          <p className="text-sm text-muted-foreground">
            소스 조합이 좋아서 재구매 의사가 있는 메뉴라는 예시 후기를 표시합니다.
          </p>
          <div className="mt-3">
            <Badge variant="outline">후기 아이템 예시</Badge>
          </div>
        </Card>
      </div>
    ),
  },
];
