-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 홈 헤더의 "9.18 07:00 갱신"용. crawl_runs 는 error 컬럼 때문에 anon 에게 열지 않고,
-- 브랜드별 마지막 실행의 상태·시각만 뷰로 낸다. (security_invoker 없음 → 소유자 권한으로 RLS 우회, 의도된 것)
create or replace view public.crawl_status as
select distinct on (brand) brand, status, started_at, finished_at
from public.crawl_runs
order by brand, started_at desc;

grant select on public.crawl_status to anon, authenticated;
