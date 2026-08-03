-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 큐레이션 컬럼. 크롤러는 이 컬럼들을 payload 에 넣지 않으므로 매일 upsert 되어도 지워지지 않는다.
-- 운영자가 Supabase 에서 직접 고치는 값이며, 코드는 항상 "큐레이션 값 ?? 수집 값" 순으로 읽는다.
alter table public.menus
  add column if not exists curated_kind         text check (curated_kind is null or curated_kind in ('burger', 'other')),
  add column if not exists curated_release_date date,
  add column if not exists curated_hidden       boolean not null default false,
  add column if not exists curated_note         text;

comment on column public.menus.curated_kind         is '버거 판정 강제. null 이면 category 규칙으로 판단';
comment on column public.menus.curated_release_date is '브랜드가 출시일을 안 줄 때 운영자가 넣는 출시일. 정렬·신메뉴 판정에서 release_date 보다 우선';
comment on column public.menus.curated_hidden       is 'true 면 판매 중이어도 사이트 전체에서 숨김';
comment on column public.menus.curated_note         is '운영 메모. 화면에 노출하지 않음';
