# 메뉴 큐레이션 가이드 — Supabase 에서 직접 고치기

크롤러가 매일 아침 `menus` 를 덮어쓰기 때문에, 운영자가 손으로 고칠 수 있는 곳은 **`curated_*` 4개 컬럼뿐**이다. 다른 컬럼을 고치면 다음 수집 때 원래대로 돌아간다.

| 컬럼 | 값 | 효과 |
|---|---|---|
| `curated_kind` | `'burger'` · `'other'` · `null` | 버거 판정을 강제한다. `null` 이면 코드의 카테고리 규칙(`src/lib/menu-rules.ts` 의 `BURGER_RULES`)을 따른다 |
| `curated_release_date` | `YYYY-MM-DD` · `null` | 출시일. 브랜드가 준 `release_date` 보다 우선한다. 신메뉴 판정(오늘 기준 180일)과 최신순 정렬에 쓰인다 |
| `curated_hidden` | `true` · `false` | `true` 면 판매 중이어도 홈·상세 어디에도 안 나온다 |
| `curated_note` | 자유 텍스트 | 왜 고쳤는지 메모. 화면에 나오지 않는다 |

코드는 항상 **큐레이션 값 → 수집 값** 순으로 읽는다. 되돌리려면 `null`(또는 `false`)로 바꾸면 된다.

## menus 에는 버거만 있다

2026-09-22 결정: 테이블에 버거만 둔다. 음료·사이드·피자·치킨·2인 묶음팩은 크롤러가 수집해도 저장하지 않는다 (`crawler/sync.ts`). 기존 비버거 306행은 `pnpm cleanup:menus --apply` 로 삭제했다.

- 검토 대상이 512행에서 206행으로 줄었다. Table Editor 로 훑을 수 있는 크기다.
- **저장되지 않은 항목은 `curated_kind` 로 올릴 수 없다** — 행 자체가 없다. 넣고 싶으면 `src/lib/menu-rules.ts` 의 `BURGER_RULES` 를 고친다. 규칙을 고치면 다음 수집에 들어온다.
- 반대로 저장된 행을 내리는 건 `curated_kind = 'other'` 로 가능하고, 그 값은 다음 수집에서도 유지된다 (다음 수집 때 저장 자체가 안 된다).

## 절대 고치지 않는 컬럼

`name` · `category` · `badge` · `release_date` · `price_*` · `image_url` · `is_featured` · `is_active` 등 **수집 컬럼 전부**. 크롤러의 upsert 페이로드에 들어 있어 다음날 07:00 에 덮어써진다. 값이 틀렸다면 파서(`crawler/sources/*.ts`)를 고치는 게 맞다.

`first_seen_at` · `created_at` · `reactivated_at` 도 건드리지 않는다. 처음 본 시각과 돌아온 시각이 곧 기록이다.

## 어디서 고치나

**Table Editor** (Dashboard → Table Editor → `menus`) — 한두 건 고칠 때. 셀을 더블클릭해 값을 넣고 저장하면 즉시 반영된다. `curated_kind` 는 `burger` / `other` 만 허용되고 다른 값은 저장이 거부된다.

**SQL Editor** (Dashboard → SQL Editor) — 여러 건을 한 번에 고치거나, 검토용 조회를 돌릴 때. 아래 레시피를 복사해 쓴다.

두 방법 모두 대시보드는 RLS 를 우회하므로 별도 키가 필요 없다. 서비스 롤 키를 브라우저나 문서에 붙여 넣지 않는다.

## 검토 루프

1. 로컬에서 `pnpm preview:home --other` — 버거로 잡히지 않은 판매 중 메뉴. 여기서 버거를 찾으면 `curated_kind = 'burger'`
2. `pnpm preview:home` — 오늘 홈 첫 블록. 출시일이 없어 확인일로 줄 선 항목 수가 마지막에 찍힌다. 브랜드 사이트·보도자료를 보고 `curated_release_date` 를 넣는다
3. 고친 뒤 `pnpm preview:home` 을 다시 돌려 자리가 잡혔는지 본다
4. `crawl_runs` 에서 최근 실행이 `failed` 인 브랜드가 없는지 본다 (아래 조회)

주기는 **주 1회**면 충분하다. 브랜드는 보통 한 달에 한 시리즈를 낸다. 맘스터치는 자동화에서 빠져 있으니(해외 IP 차단) 검토 전에 한국 IP 에서 `pnpm crawl moms` 를 한 번 돌린다.

## 레시피

### 어떤 행인지 찾기

```sql
-- 이름으로 찾기. 같은 이름이 카테고리별로 여러 행일 수 있다
select id, brand, name, category, badge, release_date, first_seen_at::date,
       curated_kind, curated_release_date, curated_hidden, curated_note
from menus
where brand = 'burgerking' and name like '%트러플%'
order by name;
```

### 버거인데 안 잡힘 → 올리기

```sql
-- 예: 맥모닝 버거를 메인에 올리고 싶을 때
update menus
set curated_kind = 'burger',
    curated_note = '모닝 버거도 신메뉴로 노출 (2026-09 검토)'
where brand = 'mcdonald' and name like '%그릴드 치킨 모닝 버거%';
```

### 버거로 잡혔는데 아님 → 내리기

```sql
update menus
set curated_kind = 'other',
    curated_note = '버거가 아니라 랩'
where brand = 'burgerking' and name = '크리스퍼 랩';
```

### 출시일 넣기

브랜드가 출시일을 안 주는 3사(버거킹·롯데리아·맘스터치)의 NEW 메뉴는 이 값이 없으면 처음 확인한 날로 줄을 선다. 세트·라지세트 행에도 같이 넣어야 묶음 날짜가 일관된다 — `like` 로 한 번에 잡는다.

```sql
update menus
set curated_release_date = '2026-09-10',
    curated_note = '버거킹 보도자료 기준'
where brand = 'burgerking' and name like '핫 트러플 머쉬룸 와퍼%';
```

### 숨기기 / 다시 보이기

```sql
-- 숨기기. 판매 중이어도 사이트 전체에서 사라진다. 공유된 상세 링크는 404
update menus set curated_hidden = true, curated_note = '테스트 메뉴로 보임'
where id = '00000000-0000-0000-0000-000000000000';

-- 되돌리기
update menus set curated_hidden = false where id = '00000000-0000-0000-0000-000000000000';
```

### 큐레이션 전부 초기화 (한 행)

```sql
update menus
set curated_kind = null, curated_release_date = null, curated_hidden = false, curated_note = null
where id = '00000000-0000-0000-0000-000000000000';
```

## 검토용 조회

### 출시일 없는 NEW 메뉴 — `curated_release_date` 후보

```sql
select brand, name, category, first_seen_at::date as first_seen
from menus
where is_active and badge = 'NEW'
  and release_date is null and curated_release_date is null
order by brand, name;
```

### 지금까지 큐레이션한 행 전부

```sql
select brand, name, curated_kind, curated_release_date, curated_hidden, curated_note, updated_at::date
from menus
where curated_kind is not null or curated_release_date is not null or curated_hidden
order by updated_at desc;
```

### 최근 수집 상태 — 조용히 멈춘 브랜드 찾기

```sql
select distinct on (brand) brand, status, started_at, items_seen, items_new, items_gone, error
from crawl_runs
order by brand, started_at desc;
```

`items_new > 0` 이면 그날 처음 본 메뉴가 있다는 뜻이다. `--other` 로 버거인지 확인하고, NEW 뱃지가 없으면 `curated_release_date` 를 넣어야 신메뉴로 잡힌다.

### 이번에 내려간 메뉴

```sql
select brand, name, last_seen_at::date as last_seen
from menus
where not is_active
order by last_seen_at desc
limit 30;
```

내려간 행은 지우지 않는다. 상세 페이지는 살아 있고, 아카이브가 이 기록으로 만들어진다.

## 기록(먹어봤어요)과 사진

`records` 는 사용자 데이터라 큐레이션 대상이 아니다. 다만 운영 중 볼 일이 있다.

```sql
-- 가장 많이 도전한 버거
select m.brand, m.name, s.record_count
from menu_record_stats s join menus m on m.id = s.menu_id
order by s.record_count desc limit 20;

-- 사진이 붙은 기록 수 (브랜드 이미지가 막힐 때의 보험이 얼마나 쌓였나)
select count(*) filter (where photo_path is not null) as with_photo, count(*) as total from records;
```

사진은 `record-photos` 비공개 버킷에 `{client_id}/{record_id}.jpg` 로 있다. 대시보드 Storage 에서 볼 수 있고, 공개 전환·대표 이미지 승격은 사용자 이용 허락 문구(업로드 시 고지) 범위 안에서만.

## 규칙을 코드에서 바꿔야 할 때

같은 판단을 여러 행에 반복하고 있다면 큐레이션이 아니라 규칙의 문제다. `src/lib/menu-rules.ts` 에서 고친다.

- 버거 카테고리 규칙 — `BURGER_RULES` (브랜드별 정규식)
- 신메뉴 창 — `NEW_WINDOW_DAYS` (현재 180일)
- 백필 기준일 — `BACKFILL_CUTOFF` (이 날짜 이전의 `first_seen_at` 은 출시일 대용으로 쓰지 않음)
- 화면에 내보낼 뱃지 — `BADGE_LABELS`
- 세트 접미사 — `VARIANT_SUFFIX`

바꾼 뒤 `pnpm preview:home --all` 로 전체 목록이 의도대로 나오는지 본다.
