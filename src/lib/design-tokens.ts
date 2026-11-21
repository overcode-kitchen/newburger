/**
 * 디자인 토큰 상수
 *
 * CSS 변수(`--card` 등)는 `src/app/globals.css`에서 OKLCH로 정의된다.
 * 이 파일은 TS·JS·manifest JSON 등 CSS 바깥에서 같은 값이 필요할 때
 * 사용하는 sRGB hex 미러이다. (이미지 정규화 script, sharp 등)
 *
 * 동기화 규칙:
 * - CSS(oklch) ↔ 본 파일(hex)이 반드시 같은 색을 가리켜야 한다.
 * - 값 변경 시 양쪽을 동시에 수정하고, 아래 정규화 파이프라인을 재실행한다.
 *   1) `docs/supabase/menu-image-manifest.json` defaults.background
 *   2) `scripts/normalize-menu-images.mjs` bg 값
 *   3) `pnpm normalize-menu-images --upload`
 */

/** `--card` (oklch(0.995 0.008 85)) 의 sRGB hex */
export const CARD_SURFACE_HEX = "#FFFDF7";

/** `--background` (oklch(0.985 0.012 85)) 의 sRGB hex */
export const BACKGROUND_SURFACE_HEX = "#FEFAF1";

/** `--muted` (oklch(0.955 0.018 85)) 의 sRGB hex */
export const MUTED_SURFACE_HEX = "#F6EFE3";
