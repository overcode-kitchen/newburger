import * as cheerio from "cheerio";
import { fetchHtml, sleep } from "../http";
import { stripHtml } from "../normalize";
import type { BrandSource, CrawledMenu } from "../types";

/**
 * 맘스터치 — PHP 서버 렌더링. /menu/new.php?s_sect1={카테고리}&pageNo={n}
 * 카드: <li><a href="javascript:go_view('IDX')"><i class="new">NEW</i><figure>…</figure><p class="sub-text/><h3/><p/></a></li>
 * 가격은 HTML 주석 처리돼 있고 영양성분 탭은 비어 있어 목록만 수집한다. 상세는 호출하지 않는다.
 */
const SITE = "https://momstouch.co.kr";
const PAGE_DELAY_MS = 300;

/** "new" 는 실제 카테고리가 아니라 New! 탭. 여기 있으면 is_featured */
const CATEGORIES: ReadonlyArray<{ code: string; name: string | null }> = [
  { code: "new", name: null },
  { code: "CG0005", name: "버거" },
  { code: "CG0004", name: "치킨" },
  { code: "CG0003", name: "맘스세트" },
  { code: "CG0002", name: "사이드" },
  { code: "CG0001", name: "음료" },
  { code: "CG0045", name: "또잇 치킨" },
  { code: "CG0046", name: "피자" },
];

interface MomsCard {
  idx: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  isNew: boolean;
}

function parseCards(html: string): { cards: MomsCard[]; lastPage: number } {
  const $ = cheerio.load(html);
  const cards: MomsCard[] = [];

  $(".menu-list li").each((_, li) => {
    const a = $(li).find("a[href*='go_view']").first();
    const idx = /go_view\('(\d+)'\)/.exec(a.attr("href") ?? "")?.[1];
    if (!idx) return;
    const bg = /url\(['"]?([^'")]+)['"]?\)/.exec($(li).find("figure span").attr("style") ?? "")?.[1];
    cards.push({
      idx,
      name: stripHtml($(li).find("h3").text()) ?? `(이름 없음 #${idx})`,
      subtitle: stripHtml($(li).find("p.sub-text").text()),
      description: stripHtml($(li).find("p").not(".sub-text").first().text()),
      image: bg ? new URL(bg, SITE).toString() : null,
      isNew: $(li).find("i.new").length > 0,
    });
  });

  const pages = $(".menu-pagination a, .menu-pagination strong")
    .map((_, el) => Number($(el).text().trim()))
    .get()
    .filter((n) => Number.isFinite(n));
  return { cards, lastPage: pages.length > 0 ? Math.max(...pages) : 1 };
}

export const momstouch: BrandSource = {
  brand: "moms",
  async crawl() {
    const byIdx = new Map<string, { card: MomsCard; categories: string[]; featured: boolean }>();

    for (const cat of CATEGORIES) {
      let page = 1;
      let lastPage = 1;
      do {
        const html = await fetchHtml(`${SITE}/menu/new.php?s_sect1=${cat.code}&pageNo=${page}`, { referer: `${SITE}/home.php` });
        const parsed = parseCards(html);
        lastPage = parsed.lastPage;
        for (const card of parsed.cards) {
          const entry = byIdx.get(card.idx);
          if (entry) {
            if (cat.name) entry.categories.push(cat.name);
            entry.featured ||= cat.name === null;
          } else {
            byIdx.set(card.idx, { card, categories: cat.name ? [cat.name] : [], featured: cat.name === null });
          }
        }
        page += 1;
        await sleep(PAGE_DELAY_MS);
      } while (page <= lastPage);
    }

    return [...byIdx.entries()].map(([idx, { card, categories, featured }]): CrawledMenu => {
      const primary = CATEGORIES.find((c) => c.name === categories[0])?.code ?? "new";
      return {
        brand: "moms",
        source_id: idx,
        name: card.name,
        name_en: null,
        description: [card.subtitle, card.description].filter(Boolean).join(" — ") || null,
        category: categories.length > 0 ? categories.join(", ") : null,
        image_url: card.image,
        official_link: `${SITE}/menu/view.php?idx=${idx}&s_sect1=${primary}`,
        price_single: null,
        price_set: null,
        release_date: null,
        end_date: null,
        is_limited: false,
        calories: null,
        calories_text: null,
        badge: card.isNew ? "NEW" : null,
        is_featured: featured,
        raw: { ...card, categories },
      };
    });
  },
};
