-- 가격 큐레이션 (2026-09-22)
--
-- 맥도날드·맘스터치는 웹에 가격을 공개하지 않는다 (API 72필드에 가격 키 없음 · 상세 HTML 은 주석 처리된 0원).
-- 수집으로는 영원히 null 이므로 운영자가 확인한 값만이 유일한 출처다.
-- 확인일을 반드시 같이 넣는다 — 화면에 "9월 기준"으로 표시되고, 120일이 지나면 preview:home 이 알린다.
--
-- 대표 행에만 넣으면 된다 (묶음의 가격은 대표 행에서 읽는다).

-- ── 맥도날드 3건 · 출처: 보도자료 ────────────────────────
-- 맥크리스피 고추장 버터 — 단품 8,500 / 세트 10,700 (ACROFAN 2026-09-17)
update menus
set curated_price_single = 8500, curated_price_set = 10700, curated_price_checked = '2026-09-22',
    curated_note = coalesce(curated_note || ' · ', '') || '가격: 보도자료 2026-09-17'
where brand = 'mcdonald' and name like '맥크리스피%고추장 버터%';

-- 맥스파이시 고추장 버터 — 단품 7,500 / 세트 9,700 (ACROFAN 2026-09-17)
update menus
set curated_price_single = 7500, curated_price_set = 9700, curated_price_checked = '2026-09-22',
    curated_note = coalesce(curated_note || ' · ', '') || '가격: 보도자료 2026-09-17'
where brand = 'mcdonald' and name like '맥스파이시%고추장 버터%';

-- 불고기 버거 — 해피 스낵 할인가 2,500 (정상가 3,800 · 아주경제 2026-08-20). 10/7까지
update menus
set curated_price_single = 2500, curated_price_checked = '2026-09-22',
    curated_note = coalesce(curated_note || ' · ', '') || '가격: 해피 스낵 할인가 2,500 (정상 3,800) 아주경제 2026-08-20'
where brand = 'mcdonald' and name = '불고기 버거' and category like '%해피 스낵%';

-- ── 맘스터치 6건 · 웹에서 확인 불가 ──────────────────────
-- 보도자료(핀포인트뉴스·인더스트리뉴스 2026-09-09, 신아일보 2026-08-10)에 가격이 없다.
-- 검색으로 나오는 값은 배달앱 가격(매장가보다 비쌈)이거나 2022·2020년 구제품 가격이라 쓰지 않는다.
-- 매장 메뉴판·맘스터치 앱에서 확인해 아래 0 을 채우고 주석을 풀어 실행한다.
--
-- update menus set curated_price_single = 0, curated_price_set = 0, curated_price_checked = '2026-09-22',
--   curated_note = coalesce(curated_note || ' · ', '') || '가격: 매장 확인'
-- where brand = 'moms' and name = '스모키스매쉬버거';
--
-- 같은 형식으로: 스매쉬버거 · 더블스매쉬버거 · 그릴드버거 · 그릴드베이컨버거 · 내슈빌핫치킨버거
