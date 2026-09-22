-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 취급 한정 표시. 브랜드 사이트는 "이 메뉴가 존재한다"만 말하고 "어디서 파는지"는 알려주지 않는다.
-- 맘스터치 스매쉬·그릴드 5종은 "철판 조리 시설을 갖춘 1000여개 비프버거 판매점"에서만 판다 —
-- 전 매장이 아니다. 이걸 모르고 가면 헛걸음이 된다. 틀린 정보보다 나쁜 종류라 화면에 밝힌다.
alter table public.menus add column if not exists curated_availability text;

comment on column public.menus.curated_availability is
  '전 매장에서 팔지 않을 때의 한 줄 안내. 예: "일부 매장만 판매". 화면 카드·상세에 그대로 노출된다';
