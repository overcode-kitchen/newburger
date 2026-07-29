const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** `맥윙<sub class=reg>™</sub>` → `맥윙™`. 태그만 제거하고 안의 문자는 살린다. */
export function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

/**
 * 브랜드마다 날짜 형식이 제각각이라 알려진 형태를 모두 받는다.
 *   2026-08-06 00:00 · 2026.September.17th 00:12 · 2026-August-4th
 * 반환은 YYYY-MM-DD. 못 읽으면 null.
 */
export function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const named = /^(\d{4})[.\-\s]+([A-Za-z]+)[.\-\s]+(\d{1,2})(?:st|nd|rd|th)?/.exec(s);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (!month) return null;
    return `${named[1]}-${String(month).padStart(2, "0")}-${named[3].padStart(2, "0")}`;
  }

  return null;
}

/** 2050년 이후 종료일은 "상시 판매"를 뜻하는 관용 값(2099·9999 등)으로 본다. */
export function isEvergreen(dateYmd: string | null): boolean {
  if (!dateYmd) return true;
  return Number(dateYmd.slice(0, 4)) >= 2050;
}

/**
 * `910~1049` · `1191-1330` · `266` · `-` 를 모두 받는다.
 * calories 는 범위의 최솟값(정렬용), calories_text 는 원문(표시용).
 */
export function parseCalories(value: string | null | undefined): {
  calories: number | null;
  calories_text: string | null;
} {
  const text = stripHtml(value);
  if (!text || text === "-") return { calories: null, calories_text: null };
  const first = /(\d+)/.exec(text);
  return {
    calories: first ? Number(first[1]) : null,
    calories_text: text,
  };
}

/** 정수 가격. 0 이하·NaN 은 "모름"으로 보고 null. */
export function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}
