#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_MANIFEST_PATH = "docs/supabase/menu-image-manifest.json";
const DEFAULT_OUTPUT_DIR = ".generated/menu-images";
const DEFAULT_REPORT_PATH = ".generated/menu-images/report.json";
const DEFAULT_SQL_PATH = ".generated/menu-images/update-image-urls.sql";

function parseArgs(argv) {
  const options = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    outputDir: DEFAULT_OUTPUT_DIR,
    reportPath: DEFAULT_REPORT_PATH,
    sqlPath: DEFAULT_SQL_PATH,
    upload: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--manifest=")) {
      options.manifestPath = arg.replace("--manifest=", "");
    } else if (arg.startsWith("--output=")) {
      options.outputDir = arg.replace("--output=", "");
    } else if (arg.startsWith("--report=")) {
      options.reportPath = arg.replace("--report=", "");
    } else if (arg.startsWith("--sql=")) {
      options.sqlPath = arg.replace("--sql=", "");
    } else if (arg === "--upload") {
      options.upload = true;
    }
  }

  return options;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizePathPart(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
}

function getSupabasePublicBaseFromUrl(urlValue) {
  if (!urlValue) return null;
  try {
    const parsed = new URL(urlValue);
    return `${parsed.origin}/storage/v1/object/public`;
  } catch {
    return null;
  }
}

async function normalizeImage(sourceBuffer, config) {
  const {
    canvasWidth,
    canvasHeight,
    occupancy,
    maxScale,
    minScale,
    background,
    anchor,
    yOffsetRatio,
  } = config;

  const trimmed = sharp(sourceBuffer).ensureAlpha().trim();
  const trimmedMeta = await trimmed.metadata();
  if (!trimmedMeta.width || !trimmedMeta.height) {
    throw new Error("이미지 메타데이터를 읽을 수 없습니다.");
  }

  const baseWidth = trimmedMeta.width;
  const baseHeight = trimmedMeta.height;
  const targetWidth = canvasWidth * occupancy;
  const targetHeight = canvasHeight * occupancy;
  const fitLimit = Math.min(canvasWidth / baseWidth, canvasHeight / baseHeight);
  const scale = clamp(
    Math.min(targetWidth / baseWidth, targetHeight / baseHeight),
    minScale,
    Math.min(maxScale, fitLimit),
  );

  const resizedWidth = Math.max(1, Math.round(baseWidth * scale));
  const resizedHeight = Math.max(1, Math.round(baseHeight * scale));
  const resized = await trimmed
    .resize(resizedWidth, resizedHeight, { fit: "contain" })
    .toBuffer();
  const resizedMeta = await sharp(resized).metadata();
  const safeWidth = Math.min(canvasWidth, resizedMeta.width ?? resizedWidth);
  const safeHeight = Math.min(canvasHeight, resizedMeta.height ?? resizedHeight);
  const safeResized =
    safeWidth === (resizedMeta.width ?? 0) && safeHeight === (resizedMeta.height ?? 0)
      ? resized
      : await sharp(resized)
          .resize({
            width: safeWidth,
            height: safeHeight,
            fit: "inside",
          })
          .toBuffer();

  const x = Math.round((canvasWidth - safeWidth) / 2);
  const anchorY =
    anchor === "top"
      ? Math.round(canvasHeight * 0.08)
      : Math.round((canvasHeight - safeHeight) / 2);
  const yWithOffset = anchorY + Math.round(canvasHeight * yOffsetRatio);
  const y = clamp(yWithOffset, 0, Math.max(0, canvasHeight - safeHeight));

  const outputBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background,
    },
  })
    .composite([{ input: safeResized, left: x, top: y }])
    .webp({ quality: 86 })
    .toBuffer();

  return {
    outputBuffer,
    imageBox: { width: safeWidth, height: safeHeight, x, y },
    sourceBox: { width: baseWidth, height: baseHeight },
  };
}

async function loadManifest(manifestPath) {
  const content = await readFile(manifestPath, "utf8");
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.items) || typeof parsed.defaults !== "object") {
    throw new Error("매니페스트 형식이 잘못되었습니다.");
  }
  return parsed;
}

async function maybeUpload({
  uploadEnabled,
  outputBuffer,
  storagePath,
  contentType,
}) {
  if (!uploadEnabled) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "menu-images";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "--upload 사용 시 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, outputBuffer, {
      cacheControl: "3600",
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage 업로드 실패(${storagePath}): ${error.message}`);
  }

  const publicBase = getSupabasePublicBaseFromUrl(supabaseUrl);
  if (!publicBase) return null;
  return `${publicBase}/${bucket}/${storagePath}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const manifestPath = path.resolve(cwd, options.manifestPath);
  const outputDir = path.resolve(cwd, options.outputDir);
  const reportPath = path.resolve(cwd, options.reportPath);
  const sqlPath = path.resolve(cwd, options.sqlPath);

  const manifest = await loadManifest(manifestPath);
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(sqlPath), { recursive: true });

  const report = [];
  const sqlLines = [
    "-- Generated by scripts/normalize-menu-images.mjs",
    "-- 업로드한 정규화 이미지 URL을 menus.image_url에 반영할 때 사용",
    "",
  ];

  for (const item of manifest.items) {
    const {
      id,
      brand,
      slug,
      sourceUrl,
      anchor = manifest.defaults.anchor,
      yOffsetRatio = manifest.defaults.yOffsetRatio,
      occupancy = manifest.defaults.occupancy,
      minScale = manifest.defaults.minScale,
      maxScale = manifest.defaults.maxScale,
    } = item;

    if (!brand || !slug || !sourceUrl) {
      throw new Error(
        `brand/slug/sourceUrl 누락: ${JSON.stringify(item, null, 2)}`,
      );
    }

    const safeBrand = sanitizePathPart(brand);
    const safeSlug = sanitizePathPart(slug);
    const digest = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 8);
    const filename = `${safeSlug}-${digest}.webp`;
    const localPath = path.join(outputDir, safeBrand, filename);
    const storagePath = `normalized/${safeBrand}/${filename}`;

    await mkdir(path.dirname(localPath), { recursive: true });
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`원본 다운로드 실패(${sourceUrl}): ${sourceResponse.status}`);
    }
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());

    const normalized = await normalizeImage(sourceBuffer, {
      canvasWidth: manifest.defaults.canvasWidth,
      canvasHeight: manifest.defaults.canvasHeight,
      occupancy,
      minScale,
      maxScale,
      background: manifest.defaults.background,
      anchor,
      yOffsetRatio,
    });

    await writeFile(localPath, normalized.outputBuffer);
    const uploadedUrl = await maybeUpload({
      uploadEnabled: options.upload,
      outputBuffer: normalized.outputBuffer,
      storagePath,
      contentType: "image/webp",
    });

    report.push({
      id: id ?? null,
      brand,
      slug,
      sourceUrl,
      localPath: path.relative(cwd, localPath),
      storagePath,
      uploadedUrl,
      sourceBox: normalized.sourceBox,
      imageBox: normalized.imageBox,
      config: {
        anchor,
        yOffsetRatio,
        occupancy,
        minScale,
        maxScale,
      },
    });

    if (id && uploadedUrl) {
      sqlLines.push(`update public.menus`);
      sqlLines.push(`set image_url = '${uploadedUrl}'`);
      sqlLines.push(`where id = '${id}';`);
      sqlLines.push("");
    }
  }

  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        manifestPath: path.relative(cwd, manifestPath),
        upload: options.upload,
        items: report,
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(sqlPath, `${sqlLines.join("\n")}\n`);

  console.log(`정규화 완료: ${report.length}개`);
  console.log(`리포트: ${path.relative(cwd, reportPath)}`);
  console.log(`SQL: ${path.relative(cwd, sqlPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
