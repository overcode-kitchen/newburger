-- 신메뉴 출시일 백필 (2026-09-22)
--
-- 버거킹·롯데리아·맘스터치는 출시일을 주지 않아, 백필(2026-09-17~18)로 들어온 행은 날짜가 없다.
-- 보도자료로 확인한 날짜를 curated_release_date 에 넣는다. 크롤러는 이 컬럼을 건드리지 않는다.
-- like '...%' 로 세트·라지세트 행까지 함께 잡아 묶음 날짜를 일관되게 맞춘다.
--
-- 실행 후: pnpm preview:home 으로 순서 확인

-- ── 버거킹 ─────────────────────────────────────────────
-- 오리지널스 엘파소 치폴레 · 5/21 출시, 11/25까지 (컨슈머와이드 2026-05-21)
update menus set curated_release_date = '2026-05-21', curated_note = '보도자료 2026-05-21 · 11/25까지'
where brand = 'burgerking' and name like '오리지널스 엘파소 치폴레%';

-- 롱치킨버거 · 불고기 롱치킨버거 — 1년 만의 재출시 (뉴시스 2026-06-04)
update menus set curated_release_date = '2026-06-04', curated_note = '뉴시스 2026-06-04 · 재출시'
where brand = 'burgerking' and name like '%롱치킨버거%' and name not like '%X%';

-- 보일링 씨푸드 버거 2종 · 6/24~9/16 한정 (뉴시스 2026-06-22)
update menus set curated_release_date = '2026-06-24', curated_note = '뉴시스 2026-06-22 · 6/24 판매 시작'
where brand = 'burgerking' and (name like '보일링 씨푸드 버거%' or name like '보일링씨푸드버거%');

-- 펜타치즈와퍼 · 전국 재출시 (뉴시스 2026-07-22)
update menus set curated_release_date = '2026-07-22', curated_note = '뉴시스 2026-07-22 · 전국 재출시'
where brand = 'burgerking' and name like '펜타치즈와퍼%';

-- 몬스터 맥시멈 3종 (뉴시스 2026-08-19)
update menus set curated_release_date = '2026-08-19', curated_note = '뉴시스 2026-08-19 · 내년 2/23까지'
where brand = 'burgerking' and name like '몬스터 맥시멈%';

-- 트러플 머쉬룸 와퍼 · 핫 트러플 · 메종 트러플치즈 — 가을 한정 (머니투데이 2026-09-16)
update menus set curated_release_date = '2026-09-16', curated_note = '머니투데이 2026-09-16 · 가을 한정'
where brand = 'burgerking' and (name like '%트러플 머쉬룸 와퍼%' or name like '메종 트러플치즈 버거%');

-- ── 롯데리아 ───────────────────────────────────────────
-- 리아 불고기 레드 · 더블 레드 (한국경제 2026-09-02)
update menus set curated_release_date = '2026-09-02', curated_note = '한국경제 2026-09-02'
where brand = 'lotteria' and name like '리아 불고기%레드%';

-- ── 맘스터치 ───────────────────────────────────────────
-- 내슈빌핫치킨버거 — 기간 한정 재출시 (파이낸셜뉴스 2026-08-10)
update menus set curated_release_date = '2026-08-10', curated_note = '파이낸셜뉴스 2026-08-10 · 한정 재출시'
where brand = 'moms' and name like '내슈빌핫치킨버거%';

-- 스매쉬버거 3종 · 그릴드버거 2종 — 9/9 발표, 9/10 전국 판매 (핀포인트뉴스 2026-09-09)
update menus set curated_release_date = '2026-09-10', curated_note = '핀포인트뉴스 2026-09-09 · 9/10 판매 시작'
where brand = 'moms'
  and (name like '%스매쉬버거%' or name like '그릴드버거%' or name like '그릴드베이컨버거%');
