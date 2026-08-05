export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Brand = "mcdonald" | "burgerking" | "lotteria" | "moms";

export type SortOption = "latest" | "popular";

/** 서비스 이름이 "뉴버거"라 버거만 메인에 올린다. 나머지는 적재만 하고 1차 노출 대상이 아니다 */
export type MenuKind = "burger" | "other";

/** public.menus — docs/supabase/schema.sql 과 1:1 */
export interface Menu {
  id: string;
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

  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  first_seen_at: string;
  last_seen_at: string;

  // 큐레이션 · 운영자가 Supabase 에서 직접 고침. 크롤러가 덮어쓰지 않는다
  curated_kind: MenuKind | null;
  curated_release_date: string | null;
  curated_hidden: boolean;
  curated_note: string | null;

  raw: Json;

  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  menu_id: string;
  rating: number;
  comment: string | null;
  ip_hash: string;
  created_at: string;
}

/** public.menu_review_stats — reviews 를 menu_id 로 집계한 뷰. average_rating 은 numeric 이라 문자열로 올 수 있다 */
export interface MenuReviewStats {
  menu_id: string;
  review_count: number;
  average_rating: number | string;
}

export interface MenuWithStats extends Menu {
  average_rating: number;
  review_count: number;
}

/** 세트·라지세트·콤보 등 같은 버거의 변형 한 줄. 가격 정보에서만 쓴다 */
export interface MenuVariant {
  label: string;
  price: number | null;
  menu: Menu;
}

/**
 * 같은 버거의 변형 행을 하나로 묶은 단위. 화면은 메뉴 행이 아니라 이 단위를 나열한다.
 * 후기·공유 링크는 대표 행(representative) 의 id 로 고정된다.
 */
export interface MenuGroup {
  key: string;
  brand: Brand;
  /** 세트 접미사를 뗀 이름. 맥도날드처럼 세트 행만 있어도 버거 이름으로 보인다 */
  name: string;
  representative: MenuWithStats;
  members: MenuWithStats[];
  variants: MenuVariant[];
  /** 큐레이션 → 브랜드 출시일 → (백필 이후) 처음 확인한 날 순으로 고른 정렬·표시용 날짜. 없으면 null */
  date: string | null;
  is_new: boolean;
  is_hot: boolean;
  review_count: number;
  average_rating: number;
}

export type CrawlRunStatus = "running" | "ok" | "failed";

/** public.crawl_runs — 수집 실행 이력 */
export interface CrawlRun {
  id: string;
  brand: Brand;
  started_at: string;
  finished_at: string | null;
  status: CrawlRunStatus;
  items_seen: number;
  items_new: number;
  items_gone: number;
  error: string | null;
}
