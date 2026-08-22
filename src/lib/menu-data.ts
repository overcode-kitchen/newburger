import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { groupVariants, homeSections, isBurger, sortNewest, type HomeSections } from "@/lib/menu-rules";
import type { MenuGroup } from "@/types";
import type { Brand, Menu, MenuReviewStats, MenuWithStats, Review } from "@/types";

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

/**
 * 홈 두 블록. 판매 중 + 숨김 아님 전체를 한 번에 읽고 판정·묶기는 menu-rules 가 한다.
 * 브랜드 필터는 묶은 뒤에 거른다 — 같은 버거의 변형 행이 브랜드를 넘나들지 않으므로 결과는 같고, 캐시 히트가 더 좋다.
 */
export const getHomeSections = cache(async (brand: Brand | "all"): Promise<HomeSections> => {
  if (!hasSupabaseEnv) return { thisWeek: [], recent: [] };

  const supabase = await createClient();
  const [{ data: menusData, error: menusError }, { data: statsData, error: statsError }] = await Promise.all([
    supabase.from("menus").select("*").eq("is_active", true).eq("curated_hidden", false),
    supabase.from("menu_review_stats").select("*"),
  ]);
  if (menusError) throw new Error(menusError.message);
  if (statsError) throw new Error(statsError.message);

  const menus = withStats((menusData ?? []) as Menu[], (statsData ?? []) as MenuReviewStats[]);
  const sections = homeSections(menus);
  if (brand === "all") return sections;
  return {
    thisWeek: sections.thisWeek.filter((g) => g.brand === brand),
    recent: sections.recent.filter((g) => g.brand === brand),
  };
});

export interface BrandSections {
  fresh: MenuGroup[];
  regular: MenuGroup[];
}

/** 브랜드 페이지: 판매 중인 버거 전체(상시 포함)를 신메뉴 / 상시로 나눠 최신순 */
export const getBrandSections = cache(async (brand: Brand): Promise<BrandSections> => {
  if (!hasSupabaseEnv) return { fresh: [], regular: [] };

  const supabase = await createClient();
  const [{ data: menusData, error: menusError }, { data: statsData, error: statsError }] = await Promise.all([
    supabase.from("menus").select("*").eq("brand", brand).eq("is_active", true).eq("curated_hidden", false),
    supabase.from("menu_review_stats").select("*"),
  ]);
  if (menusError) throw new Error(menusError.message);
  if (statsError) throw new Error(statsError.message);

  const menus = withStats((menusData ?? []) as Menu[], (statsData ?? []) as MenuReviewStats[]);
  const groups = sortNewest(groupVariants(menus.filter(isBurger)));
  return {
    fresh: groups.filter((g) => g.is_new),
    regular: groups.filter((g) => !g.is_new),
  };
});

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
