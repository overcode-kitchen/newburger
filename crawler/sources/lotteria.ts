import * as cheerio from "cheerio";
import { fetchHtml } from "../http";
import { parsePrice, stripHtml } from "../normalize";
import type { BrandSource, CrawledMenu } from "../types";

/**
 * 롯데리아 (롯데잇츠) — /brand/ria 한 페이지에 전 메뉴가 서버 렌더링된다.
 * 섹션 제목(h2~h4) 아래 .mn-card 가 이어지므로 문서 순서로 카테고리를 배정한다.
 * robots.txt 가 상세 경로를 Disallow 하므로 목록 페이지만 쓴다.
 */
const SITE = "https://www.lotteeatz.com";
const PAGE = `${SITE}/brand/ria`;
const FEATURED_SECTION = "추천메뉴";
const SECTIONS = new Set([FEATURED_SECTION, "버거", "디저트", "치킨", "음료", "아이스샷"]);

interface RiaCard {
  id: string;
  name: string;
  price: number | null;
  badge: string | null;
  image: string | null;
  soldOut: boolean;
}

export const lotteria: BrandSource = {
  brand: "lotteria",
  async crawl() {
    // 품절 블록이 주석으로 남아 있어, 주석을 먼저 걷어내야 실제 품절만 잡힌다
    const html = (await fetchHtml(PAGE)).replace(/<!--[\s\S]*?-->/g, "");
    const $ = cheerio.load(html);

    const byId = new Map<string, { card: RiaCard; categories: string[]; featured: boolean }>();
    let current: string | null = null;

    // 섹션 제목과 카드를 문서 순서로 훑는다
    $("h2, h3, h4, .mn-card").each((_, el) => {
      const $el = $(el);
      if (!$el.hasClass("mn-card")) {
        const title = stripHtml($el.text());
        if (title && SECTIONS.has(title)) current = title;
        return;
      }

      const id = $el.find(".mn-card-body").attr("id");
      if (!id || !current) return;

      const img = $el.find("img.mn-card-img").attr("src") ?? null;
      const card: RiaCard = {
        id,
        name: stripHtml($el.find(".mn-card-name").text()) ?? `(이름 없음 ${id})`,
        price: parsePrice($el.find(".mn-card-price").first().text()),
        badge: stripHtml($el.find(".mn-badge").first().text()),
        // /dims/resize/... 는 썸네일 변환 지시자. 떼면 원본
        image: img ? img.replace(/\/dims\/.*$/, "") : null,
        soldOut: $el.find(".sold-out").length > 0,
      };

      const isFeatured = current === FEATURED_SECTION;
      const entry = byId.get(id);
      if (entry) {
        if (!isFeatured) entry.categories.push(current);
        entry.featured ||= isFeatured;
      } else {
        byId.set(id, { card, categories: isFeatured ? [] : [current], featured: isFeatured });
      }
    });

    return [...byId.values()].map(({ card, categories, featured }): CrawledMenu => ({
      brand: "lotteria",
      source_id: card.id,
      name: card.name,
      name_en: null,
      description: null,
      category: categories.length > 0 ? categories.join(", ") : null,
      image_url: card.image,
      official_link: `${PAGE}#${card.id}`,
      price_single: card.price,
      price_set: null,
      release_date: null,
      end_date: null,
      is_limited: false,
      calories: null,
      calories_text: null,
      badge: card.badge,
      is_featured: featured,
      raw: { ...card, categories },
    }));
  },
};
