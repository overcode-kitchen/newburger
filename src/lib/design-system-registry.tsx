import type { ReactNode } from "react";
import Link from "next/link";
import { BrandChips } from "@/components/brand-chips";
import { BrandMark } from "@/components/brand-mark";
import { MenuCard } from "@/components/menu-card";
import { ErrorState } from "@/components/error-state";
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
import type { MenuGroup, MenuWithStats } from "@/types";

const menuCardPreviewSample: MenuWithStats = {
  id: "00000000-0000-4000-8000-000000000001",
  brand: "burgerking",
  source_id: "preview-1",
  name: "통새우 와퍼 스파이시",
  name_en: "Shrimp Whopper Spicy",
  description:
    "디자인 시스템 프리뷰용 설명입니다. 카드 하단 그라데이션 위에 두 줄까지 표시됩니다.",
  category: "버거",
  image_url:
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=80&auto=format&fit=crop",
  official_link: null,
  price_single: 8500,
  price_set: 11800,
  release_date: "2026-04-09",
  end_date: "2026-05-20",
  is_limited: true,
  calories: 730,
  calories_text: "730",
  badge: "NEW",
  is_featured: true,
  is_active: true,
  first_seen_at: "2026-04-09T00:00:00.000Z",
  last_seen_at: "2026-04-14T00:00:00.000Z",
  curated_kind: null,
  curated_release_date: null,
  curated_hidden: false,
  curated_note: null,
  raw: {},
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-14T00:00:00.000Z",
  average_rating: 4.6,
  review_count: 128,
};

const menuCardGroupLimited: MenuGroup = {
  key: "burgerking:통새우와퍼스파이시",
  brand: "burgerking",
  name: "통새우 와퍼 스파이시",
  representative: menuCardPreviewSample,
  members: [menuCardPreviewSample],
  variants: [{ label: "세트", price: 11800, menu: menuCardPreviewSample }],
  date: "2026-04-09",
  is_new: true,
  is_hot: true,
  review_count: 0,
  average_rating: 0,
};

const menuCardGroupPriced: MenuGroup = {
  ...menuCardGroupLimited,
  key: "burgerking:통새우와퍼",
  name: "통새우 와퍼",
  representative: { ...menuCardPreviewSample, end_date: null, is_limited: false },
  date: null,
};

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
    name: "ErrorState",
    sourcePath: "src/components/error-state.tsx",
    notes: "error.tsx 공용. 빈 상태 블록과 동일한 시각 언어(점선·muted). 재시도 버튼은 onRetry 전달 시에만 노출",
    render: () => (
      <ErrorState
        title="페이지를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요. 계속 반복되면 데이터 연결 상태를 확인해 주세요."
        digest="a1b2c3d4"
      />
    ),
  },
  {
    name: "BrandMark",
    sourcePath: "src/components/brand-mark.tsx",
    notes: "로고를 그리는 유일한 곳. NEXT_PUBLIC_BRAND_MARK=logo|initial|text 로 전환. badge = 카드 위 원형(로고만) · inline = 로고 + 이름",
    render: () => (
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2 rounded-2xl bg-menu-image-matte p-3">
          <BrandMark brand="mcdonald" variant="badge" />
          <BrandMark brand="burgerking" variant="badge" />
          <BrandMark brand="lotteria" variant="badge" />
          <BrandMark brand="moms" variant="badge" />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <BrandMark brand="mcdonald" />
          <BrandMark brand="moms" size="md" />
        </div>
      </div>
    ),
  },
  {
    name: "BrandChips",
    sourcePath: "src/components/brand-chips.tsx",
    notes: "브랜드 필터. 기억 안 함. 활성 칩은 브랜드 원색, 전체는 primary",
    render: () => <BrandChips selected="burgerking" />,
  },
  {
    name: "MenuCard",
    sourcePath: "src/components/menu-card.tsx",
    notes: "grid(2열) · rail(이번 주 큰 카드, 출시일 스탬프). 메타는 종료일 > 가격 > 없음. 설명·별점·NEW 없음",
    render: () => (
      <div className="space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <MenuCard group={menuCardGroupLimited} variant="rail" />
          <MenuCard group={menuCardGroupPriced} variant="rail" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MenuCard group={menuCardGroupLimited} />
          <MenuCard group={menuCardGroupPriced} />
        </div>
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
