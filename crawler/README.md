# 메뉴 수집기

4개 브랜드 사이트에서 메뉴를 긁어 Supabase `menus` 에 반영한다. 웹 앱과 분리되어 있어 수집이 실패해도 서비스는 영향받지 않는다.

## 실행

```bash
pnpm crawl              # 4사 전체
pnpm crawl mcdonald     # 하나만 · mcdonald | burgerking | lotteria | moms
```

필요한 환경변수 (`.env.local` 또는 실행 환경):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — RLS 를 우회해 쓰기. 절대 브라우저에 노출하지 말 것

## 매일 자동화

`.github/workflows/crawl.yml` 이 **매일 07:00 KST** 에 돈다 (cron 은 UTC 22:00). Actions 탭에서 수동 실행도 가능하며 브랜드 하나만 지정할 수 있다.

켜려면:

1. 저장소 **Settings → Secrets and variables → Actions** 에 위 두 변수를 등록
2. `main` 브랜치에 푸시 — 스케줄은 기본 브랜치에서만 동작한다

실패하면 워크플로 파일을 마지막으로 수정한 사람에게 GitHub 이 메일을 보낸다. 실행 이력·건수·에러는 `crawl_runs` 테이블에도 남는다.

## 브랜드별 출처와 한계

| 브랜드 | 방식 | 가격 | 칼로리 | 출시일 | 신메뉴 신호 |
|---|---|---|---|---|---|
| 맥도날드 | 공개 JSON API (`/api/v1/kor/product/product/list`) | ✗ 미공개 | ✓ | ✓ `openTimeStart/End` | `exposureStatus=recommend` |
| 버거킹 | bizMOB 트랜잭션 POST (`BKR0632` 목록 + `BKR0634` 상세) | ✓ | ✓ | ✗ | `menuFlagList` NEW · 추천메뉴 |
| 롯데리아 | `/brand/ria` HTML 파싱 | ✓ | ✗ | ✗ | NEW/BEST 뱃지 · 추천메뉴 |
| 맘스터치 | `/menu/new.php` HTML 파싱, 8개 카테고리 페이지네이션 | ✗ 주석 처리됨 | ✗ | ✗ | `<i class="new">` · New! 탭 |

- 전부 **비공식 경로**다. 사이트가 바뀌면 파서가 깨진다. 응답 필드는 방어적으로 읽고, 실패는 `crawl_runs.error` 에 남긴다.
- 출시일이 없는 브랜드는 `first_seen_at`(처음 목격한 시각)과 `badge` 로 신메뉴를 판단한다.
- 브랜드 응답 원본은 `menus.raw` 에 통째로 있다. 나중에 컬럼이 더 필요하면 재수집 없이 여기서 꺼낸다.
- 롯데리아는 robots.txt 가 상세 페이지를 막고 있어 목록만 쓴다.

## 동작 규칙

- `(brand, source_id)` 가 같으면 같은 메뉴. 이름이 바뀌어도 새 행을 만들지 않는다.
- 이번 수집에 없는 메뉴는 삭제하지 않고 `is_active=false` 로 내린다. `last_seen_at` 은 마지막으로 목록에 있던 시각으로 남는다.
- `first_seen_at`·`created_at` 은 upsert 시 건드리지 않아 최초값이 보존된다.
- 상대 서버 부담을 줄이기 위해 버거킹 상세는 120ms, 맘스터치 페이지는 300ms 간격을 둔다.

## 구조

```
crawler/
  run.ts              진입점 · 브랜드 선택 · 실패 시 exit 1
  sync.ts             upsert · 비활성 처리 · crawl_runs 기록
  http.ts             GET/POST 유틸 · 타임아웃 · 재시도 · 딜레이
  normalize.ts        HTML 태그 제거 · 날짜 3종 · 칼로리 범위 · 가격
  types.ts            CrawledMenu · BrandSource
  sources/*.ts        브랜드별 파서 — 새 브랜드는 여기에 파일 하나 추가하고 run.ts 의 SOURCES 에 등록
```
