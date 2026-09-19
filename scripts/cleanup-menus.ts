import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { menuKind } from "../src/lib/menu-rules";
import { BRAND_LABELS } from "../src/lib/newburger";
import type { Brand, Menu } from "../src/types";

/**
 * menus 테이블에서 버거가 아닌 행을 지운다 (2026-09-22 결정: 테이블에 버거만 둔다).
 * 크롤러도 같은 규칙으로 수집 단계에서 걸러내므로 (crawler/sync.ts) 지운 행은 다시 들어오지 않는다.
 *
 *   pnpm cleanup:menus            # 무엇을 지울지만 보여준다 (기본)
 *   pnpm cleanup:menus --apply    # 실제로 지운다. 되돌릴 수 없다
 *
 * 판단은 curated_kind ?? 규칙 순이라, 운영자가 'burger' 로 올려 둔 행은 지우지 않는다.
 */

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const BRAND_ORDER: ReadonlyArray<Brand> = ["mcdonald", "burgerking", "lotteria", "moms"];

async function main() {
  loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");

  const apply = process.argv.includes("--apply");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await db.from("menus").select("*").limit(5000);
  if (error) throw new Error(error.message);

  const menus = (data ?? []) as Menu[];
  const doomed = menus.filter((m) => menuKind(m) === "other");
  const keep = menus.length - doomed.length;

  console.log(`menus ${menus.length}행 → 버거 ${keep}행 유지 · ${doomed.length}행 삭제 대상\n`);

  for (const brand of BRAND_ORDER) {
    const rows = doomed.filter((m) => m.brand === brand);
    if (rows.length === 0) continue;
    const byCategory = new Map<string, string[]>();
    for (const m of rows) {
      const k = m.category ?? "(분류 없음)";
      byCategory.set(k, [...(byCategory.get(k) ?? []), m.name]);
    }
    console.log(`## ${BRAND_LABELS[brand]} ${rows.length}행`);
    for (const [category, names] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${category} (${names.length}): ${names.slice(0, 4).join(", ")}${names.length > 4 ? " …" : ""}`);
    }
    console.log();
  }

  // 기록·후기가 달린 행은 함께 삭제된다 (on delete cascade). 사용자 데이터라 미리 알린다
  const doomedIds = doomed.map((m) => m.id);
  const [{ count: recordCount }, { count: reviewCount }] = await Promise.all([
    db.from("records").select("id", { count: "exact", head: true }).in("menu_id", doomedIds),
    db.from("reviews").select("id", { count: "exact", head: true }).in("menu_id", doomedIds),
  ]);
  if (recordCount || reviewCount) {
    console.log(`⚠️  삭제 대상에 달린 사용자 데이터 — 기록 ${recordCount ?? 0}건 · 후기 ${reviewCount ?? 0}건이 함께 지워집니다\n`);
  }

  if (!apply) {
    console.log("지우려면: pnpm cleanup:menus --apply");
    return;
  }

  // PostgREST URL 길이를 고려해 나눠 보낸다
  let deleted = 0;
  for (let i = 0; i < doomedIds.length; i += 100) {
    const chunk = doomedIds.slice(i, i + 100);
    const { error: delError } = await db.from("menus").delete().in("id", chunk);
    if (delError) throw new Error(`삭제 실패: ${delError.message}`);
    deleted += chunk.length;
  }
  console.log(`${deleted}행 삭제 완료. 남은 행은 모두 버거입니다.`);
  console.log("다음 수집부터 비버거는 저장되지 않습니다 (crawler/sync.ts).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
