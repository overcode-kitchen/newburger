export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Brand = "mcdonald" | "burgerking" | "lotteria" | "moms";

export type SortOption = "latest" | "popular";

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

export interface MenuWithStats extends Menu {
  average_rating: number;
  review_count: number;
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
