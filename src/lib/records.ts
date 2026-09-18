import "server-only";
import { cache } from "react";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { splitVariantName, todayKST } from "@/lib/menu-rules";
import type { Brand, Menu, MenuRecord, MenuRecordStats } from "@/types";

/** 허위 기록 방지는 사진이 아니라 한도로 한다: 같은 메뉴 1회(unique) + 하루 이 건수 */
export const DAILY_RECORD_LIMIT = 3;

export const PHOTO_BUCKET = "record-photos";
const SIGNED_URL_TTL = 60 * 60;

export type RecordError = "no-client" | "daily-limit" | "not-found" | "unavailable";

/** PostgREST: 테이블이 스키마 캐시에 없음 — 마이그레이션 전. 화면은 떠야 하므로 "기록 없음/불가"로 다룬다 */
const TABLE_MISSING = "PGRST205";

export const getMyRecords = cache(async (clientId: string | null): Promise<MenuRecord[]> => {
  if (!clientId || !hasAdminEnv) return [];
  const { data, error } = await createAdminClient()
    .from("records")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  if (error) {
    if (error.code === TABLE_MISSING) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as MenuRecord[];
});

export async function findMyRecord(clientId: string | null, menuId: string): Promise<MenuRecord | null> {
  const records = await getMyRecords(clientId);
  return records.find((r) => r.menu_id === menuId) ?? null;
}

/** 서울 기준 오늘 만든 기록 수. 하루 한도 판정용 */
async function countToday(clientId: string): Promise<number> {
  const startKst = new Date(`${todayKST()}T00:00:00+09:00`).toISOString();
  const { count, error } = await createAdminClient()
    .from("records")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", startKst);
  if (error) {
    if (error.code === TABLE_MISSING) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function createRecord(
  clientId: string | null,
  menuId: string,
): Promise<{ record: MenuRecord; created: boolean } | { error: RecordError }> {
  if (!clientId) return { error: "no-client" };
  if (!hasAdminEnv) return { error: "unavailable" };

  const existing = await findMyRecord(clientId, menuId);
  if (existing) return { record: existing, created: false };

  if ((await countToday(clientId)) >= DAILY_RECORD_LIMIT) return { error: "daily-limit" };

  const { data, error } = await createAdminClient()
    .from("records")
    .insert({ menu_id: menuId, client_id: clientId })
    .select("*")
    .single();
  if (error) {
    // 존재하지 않는 메뉴 id (FK) — 큐레이션으로 숨긴 게 아니라 아예 없는 id
    if (error.code === "23503") return { error: "not-found" };
    if (error.code === TABLE_MISSING) return { error: "unavailable" };
    throw new Error(error.message);
  }
  return { record: data as MenuRecord, created: true };
}

/** 사진을 비공개 버킷에 올리고 기록에 경로를 붙인다. 경로는 {client_id}/{record_id}.jpg — 같은 기록에 다시 올리면 덮어쓴다 */
export async function attachPhoto(clientId: string, recordId: string, photo: Blob): Promise<string> {
  const db = createAdminClient();
  const path = `${clientId}/${recordId}.jpg`;
  const { error: uploadError } = await db.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await db.from("records").update({ photo_path: path }).eq("id", recordId).eq("client_id", clientId);
  if (error) throw new Error(error.message);
  return path;
}

export async function deleteRecord(clientId: string, recordId: string): Promise<void> {
  const db = createAdminClient();
  const { data } = await db.from("records").select("photo_path").eq("id", recordId).eq("client_id", clientId).maybeSingle();
  if (data?.photo_path) await db.storage.from(PHOTO_BUCKET).remove([data.photo_path]);
  const { error } = await db.from("records").delete().eq("id", recordId).eq("client_id", clientId);
  if (error) throw new Error(error.message);
}

/** 비공개 버킷이라 서명 URL 로만. 병 시트를 열 때마다 새로 만든다 (1시간) */
export async function signPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0 || !hasAdminEnv) return out;
  const { data, error } = await createAdminClient().storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) return out;
  for (const item of data ?? []) if (item.signedUrl && item.path) out.set(item.path, item.signedUrl);
  return out;
}

/** 병 안의 스티커 하나. 사진이 있으면 원형 사진 스티커, 없으면 브랜드 누끼 스티커 */
export interface JarSticker {
  recordId: string;
  menuId: string;
  name: string;
  brand: Brand;
  kind: "photo" | "cut";
  /** 사진이면 서명 URL(1시간), 누끼면 브랜드 원본 URL. 둘 다 없으면 null → 기본 이미지 */
  image: string | null;
  createdAt: string;
}

/** 내 병. 기록 + 메뉴 표시 정보 + 사진 서명 URL */
export const getMyJar = cache(async (clientId: string | null): Promise<JarSticker[]> => {
  const records = await getMyRecords(clientId);
  if (records.length === 0) return [];

  const [{ data: menusData }, signed] = await Promise.all([
    createAdminClient().from("menus").select("id, name, brand, image_url").in("id", records.map((r) => r.menu_id)),
    signPhotoUrls(records.map((r) => r.photo_path).filter((p): p is string => p !== null)),
  ]);
  const menus = new Map(((menusData ?? []) as Pick<Menu, "id" | "name" | "brand" | "image_url">[]).map((m) => [m.id, m]));

  return records.flatMap((r) => {
    const menu = menus.get(r.menu_id);
    if (!menu) return [];
    const photo = r.photo_path ? (signed.get(r.photo_path) ?? null) : null;
    return [
      {
        recordId: r.id,
        menuId: r.menu_id,
        name: splitVariantName(menu.name).base,
        brand: menu.brand,
        kind: photo ? "photo" : "cut",
        image: photo ?? menu.image_url,
        createdAt: r.created_at,
      } satisfies JarSticker,
    ];
  });
});

/** "n명이 도전했어요". anon 뷰라 일반 클라이언트로 읽는다 */
export const getRecordStats = cache(async (): Promise<Map<string, number>> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("menu_record_stats").select("*");
  if (error) return new Map();
  return new Map(((data ?? []) as MenuRecordStats[]).map((s) => [s.menu_id, s.record_count]));
});
