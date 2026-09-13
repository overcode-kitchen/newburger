import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { groupVariants, homeSections, isBurger, sortNewest, type HomeSections } from "@/lib/menu-rules";
import type { MenuGroup } from "@/types";
import type { Brand, CrawlStatus, Menu, MenuReviewStats, MenuWithStats } from "@/types";

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

/** 마지막으로 성공한 수집 시각. 4사 중 가장 최근 것 — "매일 아침 갱신"이 약속이라 화면이 말해야 한다 */
export const getLastCrawledAt = cache(async (): Promise<string | null> => {
  if (!hasSupabaseEnv) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("crawl_status").select("*").eq("status", "ok");
  // 뷰가 아직 없는 DB 에서도 홈은 떠야 한다. 갱신 시각만 비운다
  if (error) return null;

  const times = ((data ?? []) as CrawlStatus[]).map((r) => r.finished_at).filter((t): t is string => t !== null);
  return times.length > 0 ? times.sort().at(-1) ?? null : null;
});

export interface MenuGroupLookup {
  group: MenuGroup;
  /** 요청한 id 가 세트 같은 변형 행이면 true — 상세는 대표 행으로 보낸다 */
  isVariant: boolean;
  /** 같은 브랜드의 다른 신버거 (이 묶음 제외) */
  siblings: MenuGroup[];
}

/** 상세: id 가 속한 묶음. 같은 브랜드 판매 중 전체를 읽어 묶어야 세트 변형이 합쳐진다 */
export const getMenuGroupById = cache(async (id: string): Promise<MenuGroupLookup | null> => {
  const menu = await getMenuById(id);
  if (!menu) return null;

  const supabase = await createClient();
  const [{ data: menusData, error: menusError }, { data: statsData, error: statsError }] = await Promise.all([
    supabase.from("menus").select("*").eq("brand", menu.brand).eq("curated_hidden", false),
    supabase.from("menu_review_stats").select("*"),
  ]);
  if (menusError) throw new Error(menusError.message);
  if (statsError) throw new Error(statsError.message);

  const menus = withStats((menusData ?? []) as Menu[], (statsData ?? []) as MenuReviewStats[]);
  // 내려간 메뉴의 상세도 열려야 하므로 is_active 로 거르지 않는다. 형제 목록만 판매 중 신메뉴로
  const groups = groupVariants(menus);
  const group = groups.find((g) => g.members.some((m) => m.id === id));
  if (!group) return null;

  const siblings = sortNewest(
    groups.filter((g) => g.key !== group.key && g.is_new && g.representative.is_active && isBurger(g.representative)),
  );
  return { group, isVariant: group.representative.id !== id, siblings };
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
