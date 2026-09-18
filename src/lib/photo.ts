/**
 * 인증샷 전처리 — 브라우저에서. 서버로 가기 전에 정사각으로 자르고 JPEG 로 줄인다.
 * 폰 원본은 3~8MB 라 그대로 올리면 느리고 비싸다. 원형 스티커가 되므로 정사각 이상은 필요 없다.
 */
export const PHOTO_SIZE = 1200;
const JPEG_QUALITY = 0.82;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // EXIF 회전을 적용해 디코드. 지원 안 하는 브라우저는 <img> 로 (요즘 브라우저는 img 도 EXIF 를 따른다)
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지를 읽을 수 없어요"));
      img.src = URL.createObjectURL(file);
    });
  }
}

export async function toSquareJpeg(file: File): Promise<Blob> {
  const source = await decode(file);
  const w = source.width;
  const h = source.height;
  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;
  const out = Math.min(PHOTO_SIZE, side);

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리할 수 없어요");
  ctx.drawImage(source, sx, sy, side, side, 0, 0, out, out);
  if ("close" in source) source.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지를 저장할 수 없어요"))), "image/jpeg", JPEG_QUALITY);
  });
}
