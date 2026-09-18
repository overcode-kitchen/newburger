"use server";

import { revalidatePath } from "next/cache";
import { getClientId } from "@/lib/client-id";
import { attachPhoto, createRecord, deleteRecord, signPhotoUrls, type RecordError } from "@/lib/records";

/** 기기에서 1200px JPEG 로 줄여 오므로 보통 100~300KB. 그래도 상한을 둔다 */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export interface RecordResult {
  ok: boolean;
  created?: boolean;
  recordId?: string;
  /** 사진을 붙였으면 바로 보여줄 서명 URL */
  photoUrl?: string;
  error?: RecordError | "bad-photo";
}

/** 먹었어요. 같은 브라우저 같은 메뉴는 1회 — 이미 있으면 그 기록을 돌려준다 */
export async function recordMenu(menuId: string): Promise<RecordResult> {
  const clientId = await getClientId();
  const result = await createRecord(clientId, menuId);
  if ("error" in result) return { ok: false, error: result.error };

  revalidatePath(`/menu/${menuId}`);
  revalidatePath("/");
  return { ok: true, created: result.created, recordId: result.record.id };
}

/** 사진 찍어서 기록. 기록을 만들고(있으면 재사용) 사진을 붙인다 */
export async function recordMenuWithPhoto(formData: FormData): Promise<RecordResult> {
  const menuId = String(formData.get("menu_id") ?? "");
  const photo = formData.get("photo");
  if (!menuId) return { ok: false, error: "not-found" };
  if (!(photo instanceof Blob) || photo.size === 0 || photo.size > MAX_PHOTO_BYTES || photo.type !== "image/jpeg") {
    return { ok: false, error: "bad-photo" };
  }

  const clientId = await getClientId();
  const result = await createRecord(clientId, menuId);
  if ("error" in result) return { ok: false, error: result.error };
  if (!clientId) return { ok: false, error: "no-client" };

  const path = await attachPhoto(clientId, result.record.id, photo);
  const signed = await signPhotoUrls([path]);

  revalidatePath(`/menu/${menuId}`);
  revalidatePath("/");
  return { ok: true, created: result.created, recordId: result.record.id, photoUrl: signed.get(path) };
}

/** 병에서 길게 눌러 삭제 (결정 4). 사진도 같이 지운다 */
export async function removeRecord(recordId: string): Promise<{ ok: boolean }> {
  const clientId = await getClientId();
  if (!clientId) return { ok: false };
  await deleteRecord(clientId, recordId);
  revalidatePath("/");
  return { ok: true };
}
