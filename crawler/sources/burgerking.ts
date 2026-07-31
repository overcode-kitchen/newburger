import { postFormJson, sleep } from "../http";
import { parseCalories, parsePrice, stripHtml } from "../normalize";
import type { BrandSource, CrawledMenu } from "../types";

/**
 * 버거킹 코리아 — bizMOB 트랜잭션 API. REST 가 아니라 코드별 POST.
 *   POST https://web-prd.burgerking.co.kr/burgerking/{trcode}.json
 *   body: message=<JSON {header:{trcode}, body:{...}}>   (x-www-form-urlencoded)
 *
 *   BKR0632 {menuKeywordList:[]} → body.allMenuList[]  카테고리별 목록 (이름·이미지·NEW 플래그)
 *   BKR0634 {menuCd}             → 상세 (가격·칼로리·3단계 분류·구성)
 *
 * 프론트에 암호화(bzCrypto) 분기가 있으나 현재 꺼져 있어 평문으로 동작한다. 켜지면 여기가 깨진다.
 */
const SITE = "https://www.burgerking.co.kr";
const API = "https://web-prd.burgerking.co.kr/burgerking";
const FEATURED_CATEGORY_SEQ = 1; // "추천메뉴"
const DETAIL_DELAY_MS = 120;

interface BkFlag { menuFlagPk?: string; menuFlagNm?: string }
interface BkListItem {
  menuCd?: string;
  menuNm?: string;
  menuComponents?: string;
  menuImgPath?: string;
  menuFlagList?: BkFlag[];
  [key: string]: unknown;
}
interface BkCategory {
  menuCategorySeq?: number | string; // 실제 응답은 문자열 "1"
  menuCategoryNm?: string;
  menuInfo?: BkListItem[];
}
interface BkDetail {
  menuCd?: string;
  menuNm?: string;
  menuDesc?: string;          // "단품" · "세트" 등
  dineInprc?: number | null;
  menuCalorie?: number | string | null;
  menuComponents?: string | null;
  menu_category_depth1?: string;
  menu_category_depth2?: string;
  menu_category_depth3?: string;
  menuImgPath?: string;
  menuFlagList?: BkFlag[];
  [key: string]: unknown;
}
interface BkResponse<T> { header?: { result?: boolean; error_code?: string; error_text?: string }; body?: T }

async function tr<T>(trcode: string, body: Record<string, unknown>): Promise<T> {
  const message = {
    header: { result: true, error_code: "", error_text: "", info_text: "", message_version: "", login_session_id: "", trcode },
    body,
  };
  const res = await postFormJson<BkResponse<T>>(
    `${API}/${trcode}.json`,
    { message: JSON.stringify(message) },
    { referer: `${SITE}/` },
  );
  if (res.header?.result === false) {
    throw new Error(`${trcode} 실패: ${res.header.error_code} ${res.header.error_text}`);
  }
  return (res.body ?? {}) as T;
}

function badgeOf(flags: BkFlag[] | undefined): string | null {
  const names = (flags ?? []).map((f) => stripHtml(f.menuFlagNm)).filter((n): n is string => !!n);
  return names.length > 0 ? names.join(",") : null;
}

export const burgerking: BrandSource = {
  brand: "burgerking",
  async crawl() {
    const { allMenuList = [] } = await tr<{ allMenuList?: BkCategory[] }>("BKR0632", { menuKeywordList: [] });

    // 같은 menuCd 가 여러 카테고리에 걸친다. 첫 등장을 기준으로 삼고 카테고리명은 모은다.
    const byCd = new Map<string, { item: BkListItem; categories: string[]; featured: boolean }>();
    for (const cat of allMenuList) {
      const catName = stripHtml(cat.menuCategoryNm) ?? `카테고리 ${cat.menuCategorySeq}`;
      const isFeaturedCat = Number(cat.menuCategorySeq) === FEATURED_CATEGORY_SEQ;
      for (const item of cat.menuInfo ?? []) {
        if (!item.menuCd) continue;
        const entry = byCd.get(item.menuCd);
        if (entry) {
          if (!isFeaturedCat) entry.categories.push(catName);
          entry.featured ||= isFeaturedCat;
        } else {
          byCd.set(item.menuCd, { item, categories: isFeaturedCat ? [] : [catName], featured: isFeaturedCat });
        }
      }
    }

    const menus: CrawledMenu[] = [];
    for (const [menuCd, { item, categories, featured }] of byCd) {
      // 상세는 실패해도 목록 정보만으로 행을 만든다. 가격·칼로리만 비게 된다.
      let detail: BkDetail = {};
      try {
        detail = await tr<BkDetail>("BKR0634", { menuCd });
      } catch (error) {
        console.warn(`[burgerking] 상세 실패 menuCd=${menuCd}: ${error instanceof Error ? error.message : error}`);
      }
      await sleep(DETAIL_DELAY_MS);

      const { calories, calories_text } = parseCalories(
        detail.menuCalorie === null || detail.menuCalorie === undefined ? null : String(detail.menuCalorie),
      );
      const price = parsePrice(detail.dineInprc);
      const isSet = /세트/.test(detail.menuDesc ?? "") || /세트/.test(item.menuNm ?? "");

      menus.push({
        brand: "burgerking",
        source_id: menuCd,
        name: stripHtml(item.menuNm) ?? stripHtml(detail.menuNm) ?? `(이름 없음 #${menuCd})`,
        name_en: null,
        description: stripHtml(detail.menuComponents) ?? stripHtml(item.menuComponents),
        category: categories.length > 0 ? categories.join(", ") : null,
        image_url: item.menuImgPath || detail.menuImgPath || null,
        official_link: `${SITE}/menu/detail/${menuCd}`,
        price_single: isSet ? null : price,
        price_set: isSet ? price : null,
        // 출시일을 주지 않는다. first_seen_at 과 badge 로 신메뉴를 판단한다.
        release_date: null,
        end_date: null,
        is_limited: false,
        calories,
        calories_text,
        badge: badgeOf(item.menuFlagList) ?? badgeOf(detail.menuFlagList),
        is_featured: featured,
        raw: { list: item, detail },
      });
    }

    return menus;
  },
};
