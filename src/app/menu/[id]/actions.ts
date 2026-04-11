"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createReview(formData: FormData) {
  const menuId = String(formData.get("menu_id") ?? "");
  const rating = Number(formData.get("rating"));
  const commentValue = String(formData.get("comment") ?? "").trim();
  const comment = commentValue.length > 0 ? commentValue : null;

  if (!menuId) throw new Error("menu_id is required.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("rating must be 1-5.");
  }

  const headersStore = await headers();
  const seed = [
    headersStore.get("x-forwarded-for"),
    headersStore.get("user-agent"),
    headersStore.get("accept-language"),
  ]
    .filter(Boolean)
    .join("|");
  const ipHash = createHash("sha256").update(seed || "anonymous").digest("hex");

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    menu_id: menuId,
    rating,
    comment,
    ip_hash: ipHash,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/menu/${menuId}`);
}
