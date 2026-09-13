"use server";

import { revalidatePath } from "next/cache";
import { getClientId } from "@/lib/client-id";
import { createRecord, type RecordError } from "@/lib/records";

export interface RecordResult {
  ok: boolean;
  created?: boolean;
  recordId?: string;
  error?: RecordError;
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
