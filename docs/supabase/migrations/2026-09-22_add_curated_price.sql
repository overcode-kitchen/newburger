-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 운영자가 넣는 가격. 맥도날드·맘스터치는 웹에 가격을 공개하지 않아 수집으로는 영원히 null 이다
-- (맥도날드 API 72필드에 가격 키 없음 · 맘스터치 상세는 주석 처리된 0원).
-- 확인일을 함께 저장한다 — 출처와 시점을 못 밝히는 가격은 넣지 않는다.
alter table public.menus
  add column if not exists curated_price_single  integer check (curated_price_single is null or curated_price_single > 0),
  add column if not exists curated_price_set     integer check (curated_price_set    is null or curated_price_set    > 0),
  add column if not exists curated_price_checked date;

comment on column public.menus.curated_price_single  is '운영자가 확인한 단품 가격. 수집 price_single 보다 우선';
comment on column public.menus.curated_price_set     is '운영자가 확인한 세트 가격';
comment on column public.menus.curated_price_checked is '가격을 확인한 날. 화면에 "9월 기준"으로 표시되고, 오래되면 preview:home 이 알린다';
