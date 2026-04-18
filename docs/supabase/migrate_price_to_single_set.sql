-- 레거시 `price` 컬럼이 있는 DB를 단품/세트 컬럼으로 바꿉니다. 한 번만 실행하세요.
-- 새로 `schema.sql`로 테이블을 만든 경우 이 스크립트는 실행하지 않아도 됩니다.

alter table public.menus
  add column if not exists price_single integer,
  add column if not exists price_set integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'menus'
      and column_name = 'price'
  ) then
    update public.menus set price_single = price where price_single is null;
  end if;
end $$;

alter table public.menus
  alter column price_single set not null;

alter table public.menus
  drop constraint if exists menus_price_check;

alter table public.menus
  add constraint menus_price_single_nonneg check (price_single >= 0);

alter table public.menus
  add constraint menus_price_set_nonneg check (price_set is null or price_set >= 0);

alter table public.menus drop column if exists price;
