export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Brand = "mcdonald" | "burgerking" | "lotteria" | "moms";

export type SortOption = "latest" | "popular";

export interface Menu {
  id: string;
  brand: Brand;
  name: string;
  price_single: number;
  price_set: number | null;
  image_url: string;
  release_date: string;
  end_date: string | null;
  is_limited: boolean;
  calories: number | null;
  official_link: string | null;
  description: string | null;
  created_at: string;
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
