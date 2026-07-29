import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Brand, CrawledMenu } from "./types";

export interface SyncResult {
  brand: Brand;
  seen: number;
  created: number;
  deactivated: number;
}

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * 한 브랜드의 수집 결과를 DB 에 반영한다.
 *  - (brand, source_id) 기준 upsert. first_seen_at/created_at 은 payload 에 넣지 않아 최초값이 보존된다.
 *  - 이번 수집에 없는 활성 메뉴는 is_active=false 로 내린다 (행은 유지).
 *  - 시작·종료·건수·에러를 crawl_runs 에 남긴다.
 */
export async function syncBrand(
  db: SupabaseClient,
  brand: Brand,
  items: CrawledMenu[],
): Promise<SyncResult> {
  const { data: run, error: runError } = await db
    .from("crawl_runs")
    .insert({ brand, status: "running" })
    .select("id")
    .single();
  if (runError) throw new Error(`crawl_runs insert 실패: ${runError.message}`);
  const runId = run.id as string;

  try {
    const { data: existingRows, error: existingError } = await db
      .from("menus")
      .select("source_id, is_active")
      .eq("brand", brand);
    if (existingError) throw new Error(`기존 목록 조회 실패: ${existingError.message}`);

    const existing = new Map((existingRows ?? []).map((r) => [r.source_id as string, r.is_active as boolean]));
    const seenIds = new Set(items.map((m) => m.source_id));
    const created = items.filter((m) => !existing.has(m.source_id)).length;

    const now = new Date().toISOString();
    const payload = items.map((m) => ({ ...m, is_active: true, last_seen_at: now }));

    // PostgREST 요청 크기를 고려해 나눠 보낸다
    for (let i = 0; i < payload.length; i += 100) {
      const { error } = await db
        .from("menus")
        .upsert(payload.slice(i, i + 100), { onConflict: "brand,source_id" });
      if (error) throw new Error(`menus upsert 실패: ${error.message}`);
    }

    const gone = [...existing.entries()]
      .filter(([id, active]) => active && !seenIds.has(id))
      .map(([id]) => id);
    if (gone.length > 0) {
      const { error } = await db
        .from("menus")
        .update({ is_active: false })
        .eq("brand", brand)
        .in("source_id", gone);
      if (error) throw new Error(`비활성 처리 실패: ${error.message}`);
    }

    await db
      .from("crawl_runs")
      .update({
        status: "ok",
        finished_at: new Date().toISOString(),
        items_seen: items.length,
        items_new: created,
        items_gone: gone.length,
      })
      .eq("id", runId);

    return { brand, seen: items.length, created, deactivated: gone.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .from("crawl_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error: message })
      .eq("id", runId);
    throw error;
  }
}
