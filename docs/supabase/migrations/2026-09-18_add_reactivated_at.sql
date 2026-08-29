-- schema.sql 을 이미 적용한 DB 에만 실행. 새로 만드는 DB 는 schema.sql 에 포함되어 있음.
--
-- 재출시 감지. 내려갔던 메뉴가 같은 ID 로 돌아오면 is_active 만 켜지고 first_seen_at 은 옛날 그대로라
-- 신메뉴로 잡히지 않았다 (트러플 와퍼처럼 매년 돌아오는 시즌 메뉴). 크롤러가 false→true 전환 시각을 남긴다.
alter table public.menus add column if not exists reactivated_at timestamptz;
comment on column public.menus.reactivated_at is '마지막으로 is_active 가 false→true 로 바뀐 시각. 출시일이 없으면 이 값을 출시일 대용으로 쓴다';
