import { createHash } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

type Anchor = "top" | "center";

interface NormalizeConfig {
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  occupancy: number;
  minScale: number;
  maxScale: number;
  anchor: Anchor;
  yOffsetRatio: number;
}

const DEFAULT_CONFIG: NormalizeConfig = {
  canvasWidth: 1200,
  canvasHeight: 1200,
  background: "#f7f3ed",
  occupancy: 0.72,
  minScale: 0.75,
  maxScale: 1.6,
  anchor: "top",
  yOffsetRatio: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildPublicUrl(baseUrl: string, bucket: string, objectPath: string): string {
  const origin = new URL(baseUrl).origin;
  return `${origin}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export function createNormalizedPath(rawPath: string): string {
  const fileName = rawPath.split("/").pop() ?? "image";
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const hash = createHash("sha1").update(rawPath).digest("hex").slice(0, 8);
  const folder = rawPath.includes("/") ? rawPath.split("/").slice(1, -1).join("/") : "";
  const prefix = folder ? `normalized/${folder}` : "normalized";
  return `${prefix}/${baseName}-${hash}.webp`;
}

export async function normalizeImageBuffer(
  sourceBuffer: ArrayBuffer,
  override: Partial<NormalizeConfig> = {},
): Promise<Buffer> {
  const config: NormalizeConfig = { ...DEFAULT_CONFIG, ...override };

  const trimmed = sharp(Buffer.from(sourceBuffer)).ensureAlpha().trim();
  const trimmedMeta = await trimmed.metadata();
  if (!trimmedMeta.width || !trimmedMeta.height) {
    throw new Error("이미지 메타데이터를 읽지 못했습니다.");
  }

  const baseWidth = trimmedMeta.width;
  const baseHeight = trimmedMeta.height;
  const targetWidth = config.canvasWidth * config.occupancy;
  const targetHeight = config.canvasHeight * config.occupancy;
  const fitLimit = Math.min(config.canvasWidth / baseWidth, config.canvasHeight / baseHeight);
  const scale = clamp(
    Math.min(targetWidth / baseWidth, targetHeight / baseHeight),
    config.minScale,
    Math.min(config.maxScale, fitLimit),
  );

  const resizedWidth = Math.max(1, Math.round(baseWidth * scale));
  const resizedHeight = Math.max(1, Math.round(baseHeight * scale));

  const resizedBuffer = await trimmed
    .resize(resizedWidth, resizedHeight, { fit: "contain" })
    .toBuffer();
  const resizedMeta = await sharp(resizedBuffer).metadata();
  const safeWidth = Math.min(config.canvasWidth, resizedMeta.width ?? resizedWidth);
  const safeHeight = Math.min(config.canvasHeight, resizedMeta.height ?? resizedHeight);
  const safeResizedBuffer =
    safeWidth === (resizedMeta.width ?? 0) && safeHeight === (resizedMeta.height ?? 0)
      ? resizedBuffer
      : await sharp(resizedBuffer)
          .resize({
            width: safeWidth,
            height: safeHeight,
            fit: "inside",
          })
          .toBuffer();

  const x = Math.round((config.canvasWidth - safeWidth) / 2);
  const baseY =
    config.anchor === "top"
      ? Math.round(config.canvasHeight * 0.08)
      : Math.round((config.canvasHeight - safeHeight) / 2);
  const yWithOffset = baseY + Math.round(config.canvasHeight * config.yOffsetRatio);
  const y = clamp(yWithOffset, 0, Math.max(0, config.canvasHeight - safeHeight));

  return sharp({
    create: {
      width: config.canvasWidth,
      height: config.canvasHeight,
      channels: 4,
      background: config.background,
    },
  })
    .composite([{ input: safeResizedBuffer, left: x, top: y }])
    .webp({ quality: 86 })
    .toBuffer();
}

export async function normalizeFromStorageAndSync(
  rawPath: string,
): Promise<{ normalizedPath: string; updatedRows: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "menu-images";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const normalizedPath = createNormalizedPath(rawPath);

  const { data: rawData, error: downloadError } = await admin.storage
    .from(bucket)
    .download(rawPath);
  if (downloadError || !rawData) {
    throw new Error(`원본 다운로드 실패(${rawPath}): ${downloadError?.message}`);
  }

  const normalizedBuffer = await normalizeImageBuffer(await rawData.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(normalizedPath, normalizedBuffer, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`정규화본 업로드 실패(${normalizedPath}): ${uploadError.message}`);
  }

  const rawPublicUrl = buildPublicUrl(supabaseUrl, bucket, rawPath);
  const normalizedPublicUrl = buildPublicUrl(supabaseUrl, bucket, normalizedPath);
  const { data: menus, error: selectError } = await admin
    .from("menus")
    .select("id,image_url")
    .eq("image_url", rawPublicUrl);

  if (selectError) {
    throw new Error(`menus 조회 실패: ${selectError.message}`);
  }

  let updatedRows = 0;
  for (const menu of menus ?? []) {
    const { error: updateError } = await admin
      .from("menus")
      .update({ image_url: normalizedPublicUrl })
      .eq("id", menu.id);
    if (updateError) {
      throw new Error(`menus 업데이트 실패(${menu.id}): ${updateError.message}`);
    }
    updatedRows += 1;
  }

  return { normalizedPath, updatedRows };
}
