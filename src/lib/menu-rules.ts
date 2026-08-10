import type {
  Brand,
  Menu,
  MenuGroup,
  MenuKind,
  MenuVariant,
  MenuWithStats,
} from "@/types";

/**
 * 메뉴 판정 규칙. Supabase·React 에 의존하지 않는 순수 함수만 둔다.
 *
 * 2026-09-18 결정:
 *  A. 버거 중심 — 나머지는 적재만 하고 메인에 올리지 않는다
 *  B. 신메뉴 창은 최대 6개월, 최신 출시순. 운영자가 Supabase 의 curated_* 컬럼으로 판정을 덮어쓴다
 *  C. 세트·콤보는 버거 하나로 묶고 가격 정보에서만 구분한다
 *
 * 모든 규칙은 "큐레이션 값 ?? 수집 값" 순서를 지킨다. 크롤러는 curated_* 를 건드리지 않는다.
 */

/**
 * 첫 전량 수집이 끝난 다음 날. 이 날짜 전에 찍힌 first_seen_at 은 "그때 나온 것"이 아니라 "그때 처음 본 것"이라
 * 출시일 대용으로 쓰지 않는다. 이후에 처음 보이는 행만 그 날짜를 출시일 대용으로 쓴다.
 */
export const BACKFILL_CUTOFF = "2026-09-19";

/** 브랜드가 시리즈를 6~8주 끌고, 운영자 검토 주기를 감안해 6개월까지를 신메뉴로 본다 */
export const NEW_WINDOW_DAYS = 180;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 화면에 내보내도 되는 뱃지 원문. 버거킹 ADK·ADKS 처럼 의미를 모르는 원문은 여기 없으므로 버려진다 */
const BADGE_LABELS: Readonly<Record<string, string>> = {
  NEW: "NEW",
  BEST: "BEST",
  재주문1위: "재주문 1위",
};

/** 브랜드가 "지금 밀고 있는" 신호. 신메뉴 판정에는 쓰지 않고 "핫" 표시에만 쓴다 */
const HOT_BADGES: ReadonlySet<string> = new Set(["BEST", "재주문1위"]);

interface BurgerRule {
  /** 카테고리 하나가 이 패턴이면 버거. category 는 "버거, 맥런치"처럼 쉼표로 여럿이 올 수 있다 */
  categories: RegExp;
  /** 카테고리만으로 애매한 분류(버거킹 치킨&슈림프 등). 이름까지 맞아야 버거 */
  ambiguous?: { categories: RegExp; name: RegExp };
  /** 카테고리는 버거지만 버거가 아닌 것 (롯데리아 한우연인팩 등) */
  excludeName?: RegExp;
}

const BURGER_RULES: Readonly<Record<Brand, BurgerRule>> = {
  mcdonald: {
    // 맥모닝·해피밀·해피 스낵은 버거가 섞여 있어도 1차 노출 대상이 아니다. 필요하면 curated_kind 로 올린다
    categories: /^(버거|맥런치)$/,
  },
  burgerking: {
    categories: /^(와퍼&주니어|프리미엄|오리지널스&맥시멈)$/,
    // 치킨&슈림프에는 크리스퍼(조각 치킨)가, 올데이킹에는 사이드가 섞여 있다
    ambiguous: {
      categories: /^(치킨&슈림프|올데이스낵&올데이킹)$/,
      name: /버거|와퍼|주니어/,
    },
  },
  lotteria: {
    categories: /^버거$/,
    excludeName: /팩$/,
  },
  moms: {
    // 맘스세트는 버거+치킨 묶음이라 이름으로 단품과 묶이지 않는다. 세트 카테고리째 제외
    categories: /^버거$/,
  },
};

function splitCategories(category: string | null): string[] {
  if (!category) return [];
  return category
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/** 결정 A. 큐레이션이 있으면 그 값, 없으면 브랜드별 카테고리 규칙 */
export function menuKind(menu: Menu): MenuKind {
  if (menu.curated_kind) return menu.curated_kind;

  const rule = BURGER_RULES[menu.brand];
  if (rule.excludeName?.test(menu.name)) return "other";

  const categories = splitCategories(menu.category);
  if (categories.some((c) => rule.categories.test(c))) return "burger";
  if (
    rule.ambiguous &&
    categories.some((c) => rule.ambiguous?.categories.test(c)) &&
    rule.ambiguous.name.test(menu.name)
  ) {
    return "burger";
  }
  return "other";
}

export function isBurger(menu: Menu): boolean {
  return menuKind(menu) === "burger";
}

/** 허용 목록에 있는 뱃지만 표시 라벨로 바꾼다. 나머지는 null */
export function displayBadge(badge: string | null): string | null {
  if (!badge) return null;
  return BADGE_LABELS[badge] ?? null;
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/**
 * 정렬·표시에 쓰는 날짜. 큐레이션 → 브랜드 출시일 → 백필 이후 처음 확인한 날.
 * 출시일을 안 주는 브랜드는 운영자가 curated_release_date 를 넣기 전까지 null 이거나 "확인일"이다.
 */
export function effectiveDate(menu: Menu): string | null {
  if (menu.curated_release_date) return menu.curated_release_date;
  if (menu.release_date) return menu.release_date;
  const firstSeen = toDateOnly(menu.first_seen_at);
  return firstSeen >= BACKFILL_CUTOFF ? firstSeen : null;
}

/** 오늘 날짜(YYYY-MM-DD)를 서울 기준으로. 배포 환경이 UTC 라 서버 로컬 날짜를 쓰면 아침 9시까지 어제로 판정된다 */
export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/** 종료일까지 남은 날. 지났으면 음수 */
export function daysUntil(date: string, today: string = todayKST()): number {
  return daysBetween(today, date);
}

/** 이 안에 끝나면 "곧 종료" */
export const ENDING_SOON_DAYS = 7;

/**
 * 결정 B. 판매 중이면서
 *  - 한정판(종료일이 있고 아직 안 지남)이면: 출시가 오래됐어도 포함 — "지금 아니면 못 먹는 것"은 도전 대상
 *  - 날짜가 있으면: 오늘 기준 NEW_WINDOW_DAYS 안 (미래 출시 예정은 제외)
 *  - 날짜가 없으면: 브랜드가 NEW 뱃지를 붙인 것
 * is_featured 는 상시 메뉴(빅맥 등)에도 붙어 있어 신메뉴 판정에 쓰지 않는다.
 */
export function isNew(menu: Menu, today: string = todayKST()): boolean {
  if (!menu.is_active) return false;
  if (menu.is_limited && menu.end_date && menu.end_date >= today) return true;
  const date = effectiveDate(menu);
  if (date) {
    const age = daysBetween(date, today);
    return age >= 0 && age <= NEW_WINDOW_DAYS;
  }
  return menu.badge === "NEW";
}

/** "어떤 게 핫하지" — 브랜드가 추천 영역에 올렸거나 BEST·재주문 1위 뱃지를 붙인 것 */
export function isHot(menu: Menu): boolean {
  return menu.is_featured || (menu.badge !== null && HOT_BADGES.has(menu.badge));
}

/** 이름 끝의 변형 접미사. 순서가 중요하다 — "라지세트"를 "세트"보다 먼저 봐야 "라지"가 남지 않는다 */
const VARIANT_SUFFIX = /\s*(라지\s*세트|세트|콤보)\s*$/;

const VARIANT_LABELS: Readonly<Record<string, string>> = {
  라지세트: "라지세트",
  세트: "세트",
  콤보: "콤보",
};

const VARIANT_ORDER: ReadonlyArray<string> = ["세트", "라지세트", "콤보"];

interface SplitName {
  base: string;
  variant: string | null;
}

/** "핫 트러플 머쉬룸 와퍼 라지세트" → { base: "핫 트러플 머쉬룸 와퍼", variant: "라지세트" } */
export function splitVariantName(name: string): SplitName {
  const m = VARIANT_SUFFIX.exec(name);
  if (!m) return { base: name.trim(), variant: null };
  const variant = m[1].replace(/\s+/g, "");
  return { base: name.slice(0, m.index).trim(), variant: VARIANT_LABELS[variant] ?? variant };
}

/** 그룹 키. 상표 기호·공백 차이로 같은 버거가 갈라지지 않게 전부 뗀다 */
export function groupKey(brand: Brand, baseName: string): string {
  const normalized = baseName.replace(/[®™]/g, "").replace(/\s+/g, "").toLowerCase();
  return `${brand}:${normalized}`;
}

function variantPrice(menu: Menu): number | null {
  // 버거킹은 세트 행의 가격을 price_set 에 넣어 두었다. 단품 행의 price_set 은 브랜드가 세트 가격을 같이 준 경우
  return menu.price_set ?? menu.price_single;
}

function pickRepresentative(members: MenuWithStats[]): MenuWithStats {
  const singles = members.filter((m) => splitVariantName(m.name).variant === null);
  const pool = singles.length > 0 ? singles : members;
  // 같은 이름이 두 카테고리에 있으면(버거킹 비프불고기버거) 먼저 온 쪽. 맥도날드처럼 세트만 있으면 이름이 짧은 쪽
  return [...pool].sort((a, b) => a.name.length - b.name.length)[0];
}

function buildVariants(representative: Menu, members: Menu[]): MenuVariant[] {
  const byLabel = new Map<string, MenuVariant>();

  for (const member of members) {
    if (member.id === representative.id) continue;
    const { variant } = splitVariantName(member.name);
    if (!variant || byLabel.has(variant)) continue;
    // 가격 없는 변형은 정보가 아니다. 맥도날드처럼 세트 행만 있고 가격도 없으면 변형 없이 버거 하나로만 보인다
    const price = variantPrice(member);
    if (price === null) continue;
    byLabel.set(variant, { label: variant, price, menu: member });
  }

  // 세트 행이 따로 없어도 대표 행에 세트 가격이 있으면 그것이 곧 세트 변형이다
  if (representative.price_set && !byLabel.has("세트")) {
    byLabel.set("세트", { label: "세트", price: representative.price_set, menu: representative });
  }

  return [...byLabel.values()].sort(
    (a, b) => VARIANT_ORDER.indexOf(a.label) - VARIANT_ORDER.indexOf(b.label),
  );
}

function latest(dates: Array<string | null>): string | null {
  return dates.reduce<string | null>((acc, d) => (d && (!acc || d > acc) ? d : acc), null);
}

/**
 * 결정 C. 같은 버거의 변형 행을 하나로 묶는다. 입력은 이미 kind·active·hidden 이 걸러진 목록이어야 한다.
 * 후기는 대표 행에만 달리는 것을 전제로 하되, 과거 변형 행에 달린 후기도 합산해 잃지 않는다.
 */
export function groupVariants(menus: MenuWithStats[], today: string = todayKST()): MenuGroup[] {
  const buckets = new Map<string, MenuWithStats[]>();
  for (const menu of menus) {
    const key = groupKey(menu.brand, splitVariantName(menu.name).base);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(menu);
    else buckets.set(key, [menu]);
  }

  return [...buckets.entries()].map(([key, members]) => {
    const representative = pickRepresentative(members);
    const reviewCount = members.reduce((sum, m) => sum + m.review_count, 0);
    const ratingSum = members.reduce((sum, m) => sum + m.average_rating * m.review_count, 0);

    return {
      key,
      brand: representative.brand,
      name: splitVariantName(representative.name).base,
      representative,
      members,
      variants: buildVariants(representative, members),
      date: latest(members.map(effectiveDate)),
      is_new: members.some((m) => isNew(m, today)),
      is_hot: members.some(isHot),
      review_count: reviewCount,
      average_rating: reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : 0,
    };
  });
}

/** 홈 "이번 주 나왔어요" 레일에 들어가는 기간 */
export const THIS_WEEK_DAYS = 7;

/**
 * 최신 출시순. 날짜가 있는 것이 먼저(최신순), 없는 것은 뒤로.
 * 날짜 없는 NEW 를 확인일로 줄 세우면 백필(9/17~18)분이 진짜 신메뉴보다 위로 올라오므로 뒤에 둔다.
 * 운영자가 curated_release_date 를 넣으면 그 자리로 옮겨 간다. 같은 날이면 브랜드가 밀고 있는 것 먼저, 그다음 이름순.
 */
export function sortNewest(groups: MenuGroup[]): MenuGroup[] {
  return [...groups].sort((a, b) => {
    if ((a.date === null) !== (b.date === null)) return a.date === null ? 1 : -1;
    const keyA = a.date ?? toDateOnly(a.representative.first_seen_at);
    const keyB = b.date ?? toDateOnly(b.representative.first_seen_at);
    const byDate = keyB.localeCompare(keyA);
    if (byDate !== 0) return byDate;
    if (a.is_hot !== b.is_hot) return a.is_hot ? -1 : 1;
    return a.name.localeCompare(b.name, "ko");
  });
}

/** 판매 중인 버거 중 신메뉴만, 최신순 */
export function newBurgerGroups(menus: MenuWithStats[], today: string = todayKST()): MenuGroup[] {
  const burgers = menus.filter((m) => m.is_active && !m.curated_hidden && isBurger(m));
  return sortNewest(groupVariants(burgers, today)).filter((g) => g.is_new);
}

export interface HomeSections {
  /** 출시일이 THIS_WEEK_DAYS 안 — 가로 레일 */
  thisWeek: MenuGroup[];
  /** 나머지 신메뉴 — 그리드. 날짜 있는 것 최신순, 없는 것 뒤 */
  recent: MenuGroup[];
}

/** 홈 화면 두 블록. 이번 주 것이 없으면 thisWeek 는 빈 배열이고 화면은 레일을 그리지 않는다 */
export function homeSections(menus: MenuWithStats[], today: string = todayKST()): HomeSections {
  const groups = newBurgerGroups(menus, today);
  const thisWeek = groups.filter((g) => g.date !== null && daysBetween(g.date, today) <= THIS_WEEK_DAYS);
  const recent = groups.filter((g) => !thisWeek.includes(g));
  return { thisWeek, recent };
}
