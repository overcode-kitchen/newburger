import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  displayBadge,
  groupVariants,
  homeSections,
  isBurger,
  isHot,
  isNew,
  menuKind,
  sortNewest,
  todayKST,
} from "../src/lib/menu-rules";
import { BRAND_LABELS } from "../src/lib/newburger";
import type { Brand, Menu, MenuGroup, MenuWithStats } from "../src/types";

/**
 * 오늘 홈 첫 블록에 뜰 목록을 터미널에 찍는다.
 * Supabase 에서 curated_* 를 고친 뒤 이 스크립트로 결과를 확인하는 것이 운영 검토 루프다.
 *
 *   pnpm preview:home              # 신메뉴 버거 (홈 첫 블록)
 *   pnpm preview:home --all        # 판매 중인 버거 전체
 *   pnpm preview:home --other      # 버거로 판정되지 않은 것 (curated_kind 검토용)
 *   pnpm preview:home --today 2026-10-01
 */

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const BRAND_ORDER: ReadonlyArray<Brand> = ["mcdonald", "burgerking", "lotteria", "moms"];

function won(price: number | null): string {
  return price === null ? "가격없음" : `${price.toLocaleString("ko-KR")}원`;
}

function formatGroup(g: MenuGroup): string {
  const rep = g.representative;
  const flags = [g.is_new ? "NEW" : null, g.is_hot ? "HOT" : null, rep.is_limited ? "한정" : null]
    .filter(Boolean)
    .join(" ");
  const price = [won(rep.price_single), ...g.variants.map((v) => `${v.label} ${won(v.price)}`)].join(" · ");
  const until = rep.end_date ? ` ~${rep.end_date}` : "";
  const dateSrc = rep.curated_release_date ? "큐레이션" : rep.release_date ? "브랜드" : g.date ? "확인일" : "-";
  return [
    `${(g.date ?? "----------").padEnd(10)}  ${BRAND_LABELS[g.brand].padEnd(4)}  ${g.name}`,
    `${"".padEnd(12)}${flags.padEnd(12)} ${price}${until}  [${dateSrc}] 행 ${g.members.length}`,
  ].join("\n");
}

async function main() {
  loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL 과 Supabase 키가 필요합니다.");

  const today = argValue("--today") ?? todayKST();
  const showAll = process.argv.includes("--all");
  const showOther = process.argv.includes("--other");

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("menus")
    .select("*")
    .eq("is_active", true)
    .eq("curated_hidden", false)
    .limit(5000);
  if (error) throw new Error(error.message);

  // 후기는 아직 0건이라 통계는 비워 둔다. 붙기 시작하면 menu-data.ts 의 withStats 를 쓰도록 바꾼다
  const menus: MenuWithStats[] = ((data ?? []) as Menu[]).map((m) => ({
    ...m,
    average_rating: 0,
    review_count: 0,
  }));

  if (showOther) {
    console.log(`# 버거로 판정되지 않은 판매 중 메뉴 · ${today}\n`);
    for (const brand of BRAND_ORDER) {
      const rows = menus.filter((m) => m.brand === brand && menuKind(m) === "other");
      console.log(`## ${BRAND_LABELS[brand]} ${rows.length}건`);
      for (const m of rows) {
        const mark = [isNew(m, today) ? "NEW" : null, isHot(m) ? "HOT" : null].filter(Boolean).join(" ");
        console.log(`  ${m.name}  [${m.category ?? "-"}]  ${mark}`);
      }
      console.log();
    }
    return;
  }

  const burgers = menus.filter(isBurger);
  const groups = sortNewest(groupVariants(burgers, today));
  const sections = homeSections(menus, today);
  const shown = showAll ? groups : [...sections.thisWeek, ...sections.recent];

  console.log(`# ${showAll ? "판매 중인 버거" : "신메뉴 버거 (홈)"} · 기준일 ${today}`);
  console.log(
    `# 판매 중 ${menus.length}행 → 버거 ${burgers.length}행 → 묶음 ${groups.length}개 → 표시 ${shown.length}개\n`,
  );

  if (showAll) {
    for (const g of shown) console.log(formatGroup(g) + "\n");
  } else {
    console.log(`## 이번 주 나왔어요 · ${sections.thisWeek.length}\n`);
    for (const g of sections.thisWeek) console.log(formatGroup(g) + "\n");
    console.log(`## 요즘 신버거 · ${sections.recent.length}\n`);
    for (const g of sections.recent) console.log(formatGroup(g) + "\n");
  }

  console.log("## 브랜드별");
  for (const brand of BRAND_ORDER) {
    const n = shown.filter((g) => g.brand === brand).length;
    const dated = shown.filter((g) => g.brand === brand && g.date).length;
    console.log(`  ${BRAND_LABELS[brand].padEnd(4)} ${String(n).padStart(3)}개 · 날짜 있음 ${dated}`);
  }

  const droppedBadges = new Set(
    menus.map((m) => m.badge).filter((b): b is string => b !== null && displayBadge(b) === null),
  );
  if (droppedBadges.size > 0) {
    console.log(`\n## 화면에서 버려지는 뱃지 원문: ${[...droppedBadges].join(", ")}`);
  }

  const undated = shown.filter((g) => !g.date);
  if (undated.length > 0) {
    console.log(
      `\n## 출시일이 없어 확인일로 줄 선 신메뉴 ${undated.length}개 — Supabase 에서 curated_release_date 를 넣으면 제자리로 갑니다`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
