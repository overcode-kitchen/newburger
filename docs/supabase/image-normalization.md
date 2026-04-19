# 메뉴 이미지 자동 정규화 가이드

브랜드별 원본 이미지 품질/배경이 달라도 카드에서 일관되게 보이도록 정규화합니다.

## 1) 매니페스트 작성

파일: `docs/supabase/menu-image-manifest.json`

- `defaults`
  - `canvasWidth`, `canvasHeight`: 출력 캔버스
  - `background`: PNG 투명 배경을 합성할 색
  - `occupancy`: 최종 이미지 점유율(0~1)
  - `minScale`, `maxScale`: 과축소/과확대 제한
  - `anchor`: `top` 또는 `center`
  - `yOffsetRatio`: 세로 미세 조정
- `items`
  - `brand`, `slug`, `sourceUrl` 필수
  - 필요 시 `anchor`, `occupancy` 등을 항목별 override 가능
  - `id`를 넣고 `--upload`를 사용하면 `menus.image_url` 업데이트 SQL이 자동 생성됩니다.

## 2) 반자동(배치) 정규화 실행

```bash
pnpm normalize:menu-images
```

산출물:

- `.generated/menu-images/**` 정규화 이미지(webp)
- `.generated/menu-images/report.json` 처리 결과
- `.generated/menu-images/update-image-urls.sql` 업데이트 SQL 초안

## 3) Supabase Storage 업로드까지 한 번에

환경변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (선택) `SUPABASE_STORAGE_BUCKET` 기본값 `menu-images`

실행:

```bash
pnpm normalize:menu-images -- --upload
```

업로드 성공 시 `report.json`의 `uploadedUrl`과 `update-image-urls.sql`을 사용해 `menus.image_url` 반영이 가능합니다.

## 4) 운영 권장

- 기본은 자동 정규화본 사용
- 일부 케이스만 `anchor`/`yOffsetRatio` 수동 조정
- 카드 컴포넌트 스타일은 이미지마다 바꾸지 않고 고정 preset 유지

## 5) 완전 자동화: Storage Webhook

원본을 Supabase Storage의 `raw/` 경로에 올리면 서버에서 자동 정규화되게 설정할 수 있습니다.

- 엔드포인트: `/api/supabase/storage-webhook`
- 코드: `src/app/api/supabase/storage-webhook/route.ts`
- 처리 로직: `src/lib/menu-image-normalizer.ts`

### 필요한 환경변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (기본 `menu-images`)
- `SUPABASE_STORAGE_WEBHOOK_SECRET` (웹훅 인증용)

### Supabase에서 설정

1. Storage 버킷(`menu-images`)에 `raw/` 경로로 원본 업로드
2. Database Webhooks 또는 Storage Event Webhook에서 object 생성 이벤트를 앱 엔드포인트로 전송
3. 웹훅 헤더 `x-webhook-secret`에 `SUPABASE_STORAGE_WEBHOOK_SECRET` 값 전달

### 자동 동작

1. `raw/...` 업로드 이벤트 수신
2. 정규화 이미지 생성 후 `normalized/...`에 업로드
3. 웹훅 JSON 응답의 `normalizedPublicUrl`을 복사해 `menus.image_url`에 수동 반영(테이블 자동 갱신 없음)
