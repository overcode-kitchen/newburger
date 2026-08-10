"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 이미지 로드 실패 시 기본 이미지로 떨어지는 폴백 */
export const DEFAULT_MENU_IMAGE = "/default-burger.svg";

interface MenuImageProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * 브랜드 원본 URL 을 직접 참조하므로 언제든 깨질 수 있다 (핫링크 차단, URL 변경).
 * 서버 컴포넌트에서는 onError 를 걸 수 없어 이미지만 클라이언트로 분리했다.
 */
export function MenuImage({ src, alt, sizes, className, priority = false }: MenuImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed || !src?.trim() ? DEFAULT_MENU_IMAGE : src;

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={resolved === DEFAULT_MENU_IMAGE}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
