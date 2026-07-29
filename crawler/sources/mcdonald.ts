import { fetchJson } from "../http";
import { isEvergreen, parseCalories, parseDate, stripHtml } from "../normalize";
import type { BrandSource, CrawledMenu } from "../types";

/**
 * 맥도날드 코리아 — 프론트엔드(Nuxt)가 쓰는 공개 JSON API.
 * 인증 없음. 비공식이라 예고 없이 바뀔 수 있으므로 필드 접근은 전부 방어적으로.
 *
 *   GET /api/v1/kor/product/product/list?page=1&view_rows=N&mainCategory=S
 *     - subCategory 파라미터를 0 으로 주면 0건이 돌아오므로 넣지 않는다.
 *   GET /api/v1/kor/product/recommend/list
 *     - 메인 "지금 만날 수 있는 신메뉴" 슬라이더. exposureStatus 에 recommend 로도 드러난다.
 */
const ORIGIN = "https://www.mcdonalds.co.kr";
const API = `${ORIGIN}/api/v1/kor/product`;
const REFERER = `${ORIGIN}/kor/menu/burger`;

/** mainCategory seq → 표시명 · 공식 페이지 slug (사이트 내비게이션에서 확인) */
const MAIN_CATEGORIES: ReadonlyArray<{ seq: number; name: string; slug: string }> = [
  { seq: 1, name: "버거", slug: "burger" },
  { seq: 7, name: "맥런치", slug: "mc-lunch" },
  { seq: 8, name: "해피 스낵", slug: "happy-snack" },
  { seq: 4, name: "사이드&디저트", slug: "sides" },
  { seq: 2, name: "맥모닝", slug: "mc-morning" },
  { seq: 3, name: "해피밀", slug: "happy-meal" },
  { seq: 5, name: "맥카페&음료", slug: "mc-cafe" },
];

interface McdProduct {
  seq: number;
  korName?: string;
  engName?: string;
  korContent?: string;
  pcImageUrl?: string;
  openTimeStart?: string;
  openTimeEnd?: string;
  calorie?: string;
  exposureStatus?: string;
  [key: string]: unknown;
}

interface McdListResponse {
  resultCode?: number;
  resultObject?: { totalCount?: number; list?: McdProduct[] };
}

async function fetchCategory(seq: number): Promise<McdProduct[]> {
  const url = `${API}/product/list?page=1&view_rows=500&mainCategory=${seq}`;
  const res = await fetchJson<McdListResponse>(url, { referer: REFERER });
  return res.resultObject?.list ?? [];
}

function toMenu(product: McdProduct, categories: string[], slug: string): CrawledMenu {
  const release = parseDate(product.openTimeStart);
  const endRaw = parseDate(product.openTimeEnd);
  const evergreen = isEvergreen(endRaw);
  const { calories, calories_text } = parseCalories(product.calorie);

  return {
    brand: "mcdonald",
    source_id: String(product.seq),
    name: stripHtml(product.korName) ?? `(이름 없음 #${product.seq})`,
    name_en: stripHtml(product.engName),
    description: stripHtml(product.korContent),
    category: categories.join(", "),
    image_url: product.pcImageUrl ? `${ORIGIN}${product.pcImageUrl}` : null,
    official_link: `${ORIGIN}/kor/menu/${slug}?seq=${product.seq}`,
    // 맥도날드는 가격을 공개하지 않는다
    price_single: null,
    price_set: null,
    release_date: release,
    end_date: evergreen ? null : endRaw,
    is_limited: !evergreen,
    calories,
    calories_text,
    is_featured: (product.exposureStatus ?? "").split(",").includes("recommend"),
    raw: product,
  };
}

export const mcdonald: BrandSource = {
  brand: "mcdonald",
  async crawl() {
    // 같은 상품이 여러 카테고리에 걸쳐 있어 seq 로 합친다. 첫 카테고리의 slug 를 공식 링크에 쓴다.
    const bySeq = new Map<number, { product: McdProduct; categories: string[]; slug: string }>();

    for (const cat of MAIN_CATEGORIES) {
      const list = await fetchCategory(cat.seq);
      for (const product of list) {
        if (typeof product.seq !== "number") continue;
        const entry = bySeq.get(product.seq);
        if (entry) entry.categories.push(cat.name);
        else bySeq.set(product.seq, { product, categories: [cat.name], slug: cat.slug });
      }
    }

    return [...bySeq.values()].map(({ product, categories, slug }) =>
      toMenu(product, categories, slug),
    );
  },
};
