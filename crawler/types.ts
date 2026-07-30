import type { Brand } from "../src/types";

export type { Brand };

/** 브랜드 파서가 반환하는 정규화된 메뉴 한 건. DB 컬럼과 1:1 이되 수집 상태 컬럼은 upsert 단계에서 채운다. */
export interface CrawledMenu {
  brand: Brand;
  source_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  official_link: string | null;
  price_single: number | null;
  price_set: number | null;
  release_date: string | null;
  end_date: string | null;
  is_limited: boolean;
  calories: number | null;
  calories_text: string | null;
  /** 브랜드가 붙인 뱃지 원문 (NEW·BEST …) */
  badge: string | null;
  is_featured: boolean;
  /** 브랜드 응답 원본. 스키마가 바뀌어도 여기서 꺼내 쓸 수 있게 통째로 보관 */
  raw: Record<string, unknown>;
}

export interface BrandSource {
  brand: Brand;
  crawl: () => Promise<CrawledMenu[]>;
}
