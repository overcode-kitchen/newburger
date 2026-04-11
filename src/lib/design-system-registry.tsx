import type { ReactNode } from "react";
import { MenuCard } from "@/components/menu-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  price: 8500,
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
    notes: "홈 피드용 풀블리드 이미지 + 하단 그라데이션 블러 · 목 데이터",
    render: () => (
      <div className="mx-auto max-w-sm">
        <MenuCard menu={menuCardPreviewSample} />
      </div>
    ),
  },
];
