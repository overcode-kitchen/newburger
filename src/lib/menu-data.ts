import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Menu, MenuWithStats, Review, SortOption } from "@/types";

function withStats(menus: Menu[], reviews: Review[]): MenuWithStats[] {
  const grouped = new Map<string, { sum: number; count: number }>();

  for (const review of reviews) {
    const current = grouped.get(review.menu_id) ?? { sum: 0, count: 0 };
    grouped.set(review.menu_id, {
      sum: current.sum + review.rating,
      count: current.count + 1,
    });
  }

  return menus.map((menu) => {
    const stats = grouped.get(menu.id) ?? { sum: 0, count: 0 };
    const average = stats.count > 0 ? stats.sum / stats.count : 0;
    return {
      ...menu,
      average_rating: Number(average.toFixed(1)),
      review_count: stats.count,
    };
  });
}

export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const getMenus = cache(
  async (brand: Brand | "all", sort: SortOption): Promise<MenuWithStats[]> => {
    if (!hasSupabaseEnv) return [];

    const supabase = await createClient();

    let query = supabase.from("menus").select("*");
    if (brand !== "all") query = query.eq("brand", brand);

    const { data: menusData, error: menusError } = await query.order(
      "release_date",
      { ascending: false },
    );

    if (menusError) throw new Error(menusError.message);

    const menus = (menusData ?? []) as Menu[];
    if (menus.length === 0) return [];

    const menuIds = menus.map((menu) => menu.id);
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .in("menu_id", menuIds);

    if (reviewsError) throw new Error(reviewsError.message);

    const combined = withStats(menus, (reviewsData ?? []) as Review[]);

    if (sort === "popular") {
      combined.sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return b.average_rating - a.average_rating;
        }
        return b.review_count - a.review_count;
      });
    }

    return combined;
  },
);

export const getMenuById = cache(async (id: string): Promise<MenuWithStats | null> => {
  if (!hasSupabaseEnv) return null;

  const supabase = await createClient();
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  if (menuError) {
    if (menuError.code === "PGRST116") return null;
    throw new Error(menuError.message);
  }

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .eq("menu_id", id);

  if (reviewsError) throw new Error(reviewsError.message);

  return withStats([menu as Menu], (reviewsData ?? []) as Review[])[0] ?? null;
});

export const getReviewsByMenuId = cache(async (menuId: string): Promise<Review[]> => {
  if (!hasSupabaseEnv) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("menu_id", menuId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
});
