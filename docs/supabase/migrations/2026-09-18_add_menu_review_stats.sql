-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 메뉴별 후기 집계 뷰. 홈이 메뉴 id 수백 개를 URL 에 실어 reviews 를 조회하다 게이트웨이 한도에 걸려
-- "fetch failed" 로 죽는 문제를 막는다. 집계는 DB 가 하고, 화면은 이 뷰만 읽는다.
create or replace view public.menu_review_stats
  with (security_invoker = true) as
select
  menu_id,
  count(*)::integer                as review_count,
  round(avg(rating)::numeric, 1)   as average_rating
from public.reviews
group by menu_id;

grant select on public.menu_review_stats to anon, authenticated;
