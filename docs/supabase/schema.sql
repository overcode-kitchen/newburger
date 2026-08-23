-- NewBurger v2 — 자동 수집 전제 스키마
-- Supabase SQL Editor 에서 실행. 기존 테이블을 지우고 다시 만든다 (데이터 유실 주의).

create extension if not exists "pgcrypto";

drop table if exists public.reviews cascade;
drop table if exists public.menus cascade;
drop table if exists public.crawl_runs cascade;

-- ─────────────────────────────────────────────────────────────
-- menus — 브랜드 사이트에서 매일 수집. 사람이 손으로 넣지 않는다.
-- ─────────────────────────────────────────────────────────────
create table public.menus (
  id             uuid primary key default gen_random_uuid(),

  -- 수집 식별 · (brand, source_id) 가 중복 판정 키. 이름이 바뀌어도 같은 메뉴로 본다.
  brand          text not null check (brand in ('mcdonald', 'burgerking', 'lotteria', 'moms')),
  source_id      text not null,

  -- 표시 정보
  name           text not null,
  name_en        text,
  description    text,
  category       text,                      -- 브랜드 원본 분류 (버거/사이드/음료 …). 필터링은 화면에서 판단
  image_url      text,                      -- 브랜드 원본 URL 직접 참조. null 이면 기본 이미지
  official_link  text,                      -- 브랜드 상세 페이지. 출처 표기용

  -- 가격 · 브랜드가 공개하지 않으면 null. 0 은 "무료"가 아니라 "모름"이므로 금지
  price_single   integer check (price_single is null or price_single > 0),
  price_set      integer check (price_set   is null or price_set   > 0),

  -- 판매 기간
  release_date   date,
  end_date       date,                      -- null 이면 상시
  is_limited     boolean not null default false,

  -- 영양 · 맥도날드는 "910~1049" 같은 범위 문자열을 준다
  calories       integer,                   -- 범위면 최솟값. 정렬용
  calories_text  text,                      -- 원문 그대로. 표시용

  -- 수집 상태
  badge          text,                             -- 브랜드가 붙인 뱃지 원문: NEW · BEST 등. 없으면 null
  is_featured    boolean not null default false,   -- 브랜드가 추천/신메뉴 영역에 노출 중 (맥도날드 recommend, 버거킹·롯데리아 추천메뉴, 맘스터치 New! 탭)
  is_active      boolean not null default true,    -- 최근 수집에서 목록에 존재. 사라지면 false (행은 유지)
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),

  -- 큐레이션 · 운영자가 Supabase 에서 직접 고치는 값. 크롤러 payload 에 없어 매일 upsert 되어도 보존된다.
  -- 코드는 항상 "큐레이션 값 ?? 수집 값" 순으로 읽는다
  curated_kind         text check (curated_kind is null or curated_kind in ('burger', 'other')),  -- 버거 판정 강제. null 이면 category 규칙
  curated_release_date date,                                                                       -- 출시일을 안 주는 브랜드용. release_date 보다 우선
  curated_hidden       boolean not null default false,                                             -- 판매 중이어도 사이트 전체에서 숨김
  curated_note         text,                                                                       -- 운영 메모. 화면 비노출

  -- 원본 보관 · 브랜드 응답 전체. 나중에 필요한 필드를 재수집 없이 꺼내 쓴다
  raw            jsonb not null default '{}'::jsonb,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (brand, source_id)
);

create index menus_active_featured_idx on public.menus (is_active, is_featured, release_date desc);
create index menus_brand_release_idx   on public.menus (brand, release_date desc);
create index menus_first_seen_idx      on public.menus (first_seen_at desc);

-- ─────────────────────────────────────────────────────────────
-- reviews — 익명 UGC. 메뉴가 삭제되면 함께 삭제
-- ─────────────────────────────────────────────────────────────
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  menu_id    uuid not null references public.menus(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text check (comment is null or length(comment) <= 500),
  ip_hash    text not null,
  created_at timestamptz not null default now(),

  -- 같은 방문자가 같은 메뉴에 두 번 쓰는 것을 막는다. 로그인 전까지의 완화책
  unique (menu_id, ip_hash)
);

create index reviews_menu_created_idx on public.reviews (menu_id, created_at desc);

-- 메뉴별 후기 집계. 화면은 reviews 를 id 목록으로 긁지 않고 이 뷰만 읽는다 (id 수백 개를 URL 에 실으면 게이트웨이가 끊는다)
create or replace view public.menu_review_stats
  with (security_invoker = true) as
select
  menu_id,
  count(*)::integer                as review_count,
  round(avg(rating)::numeric, 1)   as average_rating
from public.reviews
group by menu_id;

-- ─────────────────────────────────────────────────────────────
-- crawl_runs — 수집 실행 이력. 자동화가 조용히 멈추는 것을 잡기 위함
-- ─────────────────────────────────────────────────────────────
create table public.crawl_runs (
  id           uuid primary key default gen_random_uuid(),
  brand        text not null check (brand in ('mcdonald', 'burgerking', 'lotteria', 'moms')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running', 'ok', 'failed')),
  items_seen   integer not null default 0,   -- 이번 실행에서 목록에 있던 수
  items_new    integer not null default 0,   -- 처음 본 메뉴 수
  items_gone   integer not null default 0,   -- 이번에 사라져 is_active=false 된 수
  error        text
);

create index crawl_runs_brand_started_idx on public.crawl_runs (brand, started_at desc);

-- 브랜드별 마지막 실행의 상태·시각만. error 는 내보내지 않는다 (홈 헤더 "갱신" 표시용)
create or replace view public.crawl_status as
select distinct on (brand) brand, status, started_at, finished_at
from public.crawl_runs
order by brand, started_at desc;

-- ─────────────────────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger menus_set_updated_at
  before update on public.menus
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS · 익명은 읽기만. menus/crawl_runs 쓰기는 service_role(크롤러) 전용
-- ─────────────────────────────────────────────────────────────
alter table public.menus      enable row level security;
alter table public.reviews    enable row level security;
alter table public.crawl_runs enable row level security;

create policy "Public can read menus"
  on public.menus for select to anon, authenticated using (true);

create policy "Public can read reviews"
  on public.reviews for select to anon, authenticated using (true);

grant select on public.menu_review_stats to anon, authenticated;

create policy "Public can insert reviews"
  on public.reviews for insert to anon, authenticated
  with check (rating between 1 and 5 and (comment is null or length(comment) <= 500));

-- crawl_runs 는 운영자만 본다 (anon 정책 없음 → service_role 만 접근). 화면은 crawl_status 뷰만 읽는다
grant select on public.crawl_status to anon, authenticated;
