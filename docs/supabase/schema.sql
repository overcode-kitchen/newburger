-- NewBurger MVP Phase 1 (user-facing only)
-- Run this in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('mcdonald', 'burgerking', 'lotteria', 'moms')),
  name text not null,
  price integer not null check (price >= 0),
  image_url text not null,
  release_date date not null,
  end_date date,
  is_limited boolean not null default false,
  calories integer,
  official_link text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists menus_brand_release_idx
  on public.menus (brand, release_date desc);

create index if not exists reviews_menu_created_idx
  on public.reviews (menu_id, created_at desc);

alter table public.menus enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Public can read menus" on public.menus;
create policy "Public can read menus"
  on public.menus
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can insert reviews" on public.reviews;
create policy "Public can insert reviews"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    rating between 1 and 5
    and (comment is null or length(comment) <= 500)
  );
