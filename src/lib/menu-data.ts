import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Menu, MenuReviewStats, MenuWithStats, Review, SortOption } from "@/types";

function withStats(menus: Menu[], stats: MenuReviewStats[]): MenuWithStats[] {
  const byMenu = new Map(stats.map((s) => [s.menu_id, s]));

  return menus.map((menu) => {
    const stat = byMenu.get(menu.id);
    return {
      ...menu,
      average_rating: stat ? Number(stat.average_rating) : 0,
      review_count: stat?.review_count ?? 0,
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

    // 내려간 메뉴와 운영자가 숨긴 메뉴는 목록에 없다. 상세는 공유 링크가 죽지 않게 내려간 메뉴도 연다
    let query = supabase
      .from("menus")
      .select("*")
      .eq("is_active", true)
      .eq("curated_hidden", false);
    if (brand !== "all") query = query.eq("brand", brand);

    const { data: menusData, error: menusError } = await query.order(
      "release_date",
      { ascending: false },
    );

    if (menusError) throw new Error(menusError.message);

    const menus = (menusData ?? []) as Menu[];
    if (menus.length === 0) return [];

    // 메뉴 id 수백 개를 .in() 으로 보내면 URL 이 게이트웨이 한도를 넘어 fetch failed 로 죽는다. 집계 뷰를 통째로 읽는다
    const { data: statsData, error: statsError } = await supabase
      .from("menu_review_stats")
      .select("*");

    if (statsError) throw new Error(statsError.message);

    const combined = withStats(menus, (statsData ?? []) as MenuReviewStats[]);

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
    .eq("curated_hidden", false)
    .single();

  if (menuError) {
    if (menuError.code === "PGRST116") return null;
    throw new Error(menuError.message);
  }

  const { data: statsData, error: statsError } = await supabase
    .from("menu_review_stats")
    .select("*")
    .eq("menu_id", id);

  if (statsError) throw new Error(statsError.message);

  return withStats([menu as Menu], (statsData ?? []) as MenuReviewStats[])[0] ?? null;
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
