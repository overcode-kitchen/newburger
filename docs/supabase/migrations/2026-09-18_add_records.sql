-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 기록(먹어봤어요) — 도전자의 병 컬렉션. 로그인 없이 브라우저 익명 ID(client_id 쿠키) 단위로 쌓인다.
-- anon 에게 정책을 열지 않는다: RLS 로는 "내 것만"을 가를 수 없어, 서버 액션이 쿠키의 client_id 로
-- service role 을 써서 쓰고 읽는다.

create table public.records (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references public.menus(id) on delete cascade,   -- 세트 묶음의 대표 행
  client_id   uuid not null,                                                 -- 브라우저 익명 ID. 로그인 생기면 계정에 이어 붙인다
  photo_path  text,                                                          -- record-photos 버킷 경로. null 이면 브랜드 사진 스티커
  verdict     text check (verdict is null or verdict in ('good', 'bad')),    -- 좋았어요/별로예요 (Phase 3)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 같은 브라우저는 같은 메뉴에 한 번. 다시 누르면 병이 열릴 뿐
  unique (menu_id, client_id)
);

create index records_client_created_idx on public.records (client_id, created_at desc);
create index records_menu_idx           on public.records (menu_id);

create trigger records_set_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();

alter table public.records enable row level security;
-- anon 정책 없음 → service_role 만 접근

-- "n명이 도전했어요" — 개인 정보 없이 건수만. 후기 0건 상태의 첫 사회적 신호
create or replace view public.menu_record_stats as
select menu_id, count(*)::integer as record_count
from public.records
group by menu_id;

grant select on public.menu_record_stats to anon, authenticated;

-- 인증샷 버킷. 비공개 — 화면엔 서버가 만든 서명 URL 로만 나간다. 경로: {client_id}/{record_id}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('record-photos', 'record-photos', false, 2097152, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;
