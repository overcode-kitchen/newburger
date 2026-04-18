import { NextResponse } from "next/server";
import { normalizeFromStorageAndSync } from "@/lib/menu-image-normalizer";

interface StorageWebhookPayload {
  type?: string;
  record?: {
    bucket_id?: string;
    name?: string;
  };
  bucket?: string;
  path?: string;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.SUPABASE_STORAGE_WEBHOOK_SECRET;
  const expectedBucket = process.env.SUPABASE_STORAGE_BUCKET || "menu-images";
  const receivedSecret = request.headers.get("x-webhook-secret");

  if (!webhookSecret || receivedSecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized webhook call" }, { status: 401 });
  }

  let payload: StorageWebhookPayload;
  try {
    payload = (await request.json()) as StorageWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const bucket = payload.record?.bucket_id ?? payload.bucket;
  const objectPath = payload.record?.name ?? payload.path;
  if (!bucket || !objectPath) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
  }

  if (bucket !== expectedBucket) {
    return NextResponse.json({ skipped: true, reason: "Different bucket" });
  }

  if (!objectPath.startsWith("raw/")) {
    return NextResponse.json({ skipped: true, reason: "Only raw/ path is handled" });
  }

  try {
    const result = await normalizeFromStorageAndSync(objectPath);
    return NextResponse.json({
      ok: true,
      rawPath: objectPath,
      normalizedPath: result.normalizedPath,
      updatedRows: result.updatedRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
