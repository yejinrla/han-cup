# HanCup MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6개 카페 브랜드의 대표 음료를 찾아 영양·가격으로 비교하고 주변 매장을 확인하며, 카카오 로그인 후 찜과 공개·비공개 음용 기록을 관리하는 한컵 MVP를 배포한다.

**Architecture:** Next.js에서 공개 탐색 화면과 인증된 개인 화면을 제공한다. Supabase PostgreSQL·Auth에 데이터와 카카오 인증을 맡기고 DB 접근 정책으로 개인 기록을 보호한다. 검수한 공식 제품 데이터만 발행하며 카카오 지도·장소 검색은 별도 외부 어댑터로 분리한다.

**Tech Stack:** Next.js App Router, TypeScript, CSS Modules·CSS variables, Supabase PostgreSQL/Auth, Kakao Maps JavaScript SDK/Local REST API, Vercel Hobby. 검증: Vitest, Testing Library, Playwright, Supabase CLI 로컬 통합 테스트. 버전은 구현 시 공식 지원 안정판과 호환 Node.js LTS로 고정하고 lockfile을 커밋한다.

**Spec:** [승인된 설계](/workspace/docs/superpowers/specs/2026-11-12-hancup-design.md)

## Global Constraints

- 브랜드: 스타벅스, 투썸플레이스, 이디야, 메가MGC커피, 컴포즈커피, 빽다방.
- 평균 평점에는 사용자별 최신 공개 별점 한 개만 반영.
- 후기 사진 업로드 없음. 사진은 음료 목록·상세에만 사용. 사용 가능한 사진이 없으면 공통 일러스트.
- 탐색·비교·공개 후기 열람·매장 찾기는 비로그인 가능. 기록 작성과 개인 공간은 카카오 로그인 필요.
- 초기 무료 운영. 유료 서비스 가입·자동 과금은 범위 밖.
- UI는 C안: 차분한 초록색, 중립적인 밝은 배경, 음료 이미지 카드, 영양정보를 함께 읽는 구성.
- 최대 3개 음료 비교. 별점 1~5 정수, 후기 글 최대 1,000자, 기본 비공개, 미래 음용 날짜 금지(Asia/Seoul).
- null은 미제공이며 0과 다르다. 100ml 환산은 공식 영양 제공량이 검증된 변형에만 적용한다.
- 공식 자료를 검수한 뒤 발행한다. 403 차단을 우회하거나 공식 근거 없는 값을 만들지 않는다.

## Review Focus

1. 공개→비공개·삭제·숨김 직후 다른 세션과 기존 화면에서도 비공개 원문이 다시 조회되지 않아야 한다 — Task 6.
2. 변조된 URL·저장된 비교 ID·존재하지 않거나 종료된 변형에서도 탐색이 깨지지 않아야 한다 — Tasks 3, 4.
3. 한국 날짜 경계에서 미래 기록 판정이 호스트 시간대에 좌우되지 않아야 한다 — Task 6.
4. 지도 권한 거부·응답 지연·무료 쿼터 소진 시 지역 검색이나 외부 연결로 이어져야 한다 — Task 7.
5. 검수되지 않은 파일·단위 이상·수집 누락이 기존 정상 메뉴를 덮거나 삭제하지 않아야 한다 — Task 2.

## 실행 전 맥락과 파일 구조

현재 /workspace는 Git 저장소가 아니고 기존 제품 코드가 없다. 제품 저장소는 **/workspace/hancup**을 제안한다. 실행 단계에서 using-git-worktrees 지침에 따라 저장소/격리 상태를 확인하고 새 저장소가 필요하면 이 경로에 만든다. 기존 /workspace/.git에는 쓰지 않는다. 승인된 설계와 이 계획을 저장소 docs/superpowers 아래 복사하여 첫 작업에 포함한다. 이 계획 작성 중에는 프로젝트 생성·설치·계정 연결을 하지 않는다.

모든 아래 파일 경로는 /workspace/hancup 기준이다.

| 경로 | 책임 |
|---|---|
| src/app/{page,layout,globals}.tsx 또는 css | 앱 골격·공통 스타일·도감 진입 |
| src/app/drinks/[slug]/page.tsx, compare/page.tsx | 상세·비교 |
| src/app/{login,auth/callback,me,stores}/… | 인증·개인 공간·주변 매장 |
| src/features/catalog/{types,nutrition,query,repository}.ts | 도메인 계약·환산·필터·DB 읽기 |
| src/features/catalog/components/* | 검색 필터·음료 카드·목록 |
| src/features/compare/{selection.ts,components/*} | 비로그인 비교 선택과 표 |
| src/features/reviews/{schema,service,repository}.ts, components/* | 기록 검증·저장·조회·후기 UI |
| src/features/favorites/{service.ts,components/*} | 찜 저장과 내 찜 목록 |
| src/features/stores/{types,kakao,search}.ts, components/* | 장소 API·검색·지도 |
| src/lib/supabase/{browser,server,admin}.ts, src/lib/auth/* | 인증 클라이언트·서버 권한 |
| supabase/migrations/*.sql, supabase/tests/*.sql | 스키마·RLS·평점·통합 검증 |
| scripts/catalog/{schema,validate,import,rollback}.ts | 검수 데이터 검증·발행·복구 |
| data/catalog/{drafts,approved}/, public/images/drinks/ | 비밀 없는 공식 데이터·사용 가능한 이미지 |
| tests/{unit,integration,e2e}/ | 계산·접근 제어·핵심 여정 검증 |
| docs/operations/*, .env.example, README.md | 운영·외부 설정·실행 안내 |

공통 계약: BrandId는 `starbucks | twosome | ediya | mega | compose | paik`. 제품 ID와 변형 ID는 서로 다른 UUID다. 생성 시각과 ID로 정렬하여 동률도 결정적으로 처리한다. 숫자 단위는 kcal, g, mg, ml, KRW로 고정한다.

### Task 1: 검증 가능한 제품·개인 데이터 기반

**Files:** package.json, tsconfig.json, next.config.ts, vitest.config.ts, playwright.config.ts, .gitignore, .env.example, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/features/catalog/types.ts, src/lib/supabase/{browser,server,admin}.ts, supabase/config.toml, supabase/migrations/001_core.sql, supabase/tests/core_access.sql, tests/e2e/shell.spec.ts.

**Interfaces:** Produces `BrandId`, `Basis = 'serving' | '100ml'`, `Nutrition { caloriesKcal: number|null; sugarG: number|null; caffeineMg: number|null }`, `Source { url:string; checkedAt:string }`, `DrinkVariant { id:string; drinkId:string; temperature:'hot'|'iced'|'ambient'; sizeLabel:string; cupMl:number|null; nutritionBasisMl:number|null; nutrition:Nutrition; priceKrw:number|null; source:Source; imagePath:string|null }`, `Drink { id:string; slug:string; brandId:BrandId; name:string; category:'coffee'|'tea'|'ade'|'smoothie'|'other'; status:'active'|'discontinued'; defaultVariantId:string }`, `RatingSummary { average:number|null; count:number }`.

Tables: brands, drinks, drink_variants, profiles, reviews, favorites, review_reports, operator_roles, catalog_releases, catalog_release_items. Reviews: id, user_id, drink_id, variant_id nullable, rating, body, consumed_on, visibility, moderation_status, created_at, updated_at. Favorites unique(user_id,drink_id). Product status preserves referenced records. Profiles expose only public nickname through a safe projection; private columns never enter that projection. Operator membership is service-controlled.

- [ ] Create the isolated project, pin dependencies and scripts `dev`, `build`, `lint` (ESLint CLI), `typecheck`, `test`, `test:e2e`, `test:db` (`supabase test db`). Copy design/plan, ignore secrets and temporary mockups. Add env names for Supabase public URL/key, server service-role key, Kakao JS/REST keys; values remain outside Git. No external credentials are needed for fixture-only local UI.
- [ ] Add failing DB assertions: anonymous SELECT on private reviews returns 0; user A cannot INSERT a review for user B; user A cannot mutate operator_roles; rating 0/6 rejected; duplicate favorite rejected; mismatched drink/variant rejected; public catalog cannot be modified by anon. `npx supabase start`, `npx supabase db reset`, `npm run test:db` must fail before policies/schema exist.
- [ ] Implement migrations with FK/check constraints and RLS enabled from creation, plus typed Supabase browser/server clients. `admin.ts` must be server-only and never imported from client components. Private tables default deny; Task 6 adds narrowly scoped public projections and writes.
- [ ] Verify `npm run test:db`, `npm run typecheck`, `npm run build`; shell E2E asserts accessible HanCup heading at 390px viewport. Commit `feat: establish hancup data and app foundation`.

### Task 2: 공식 데이터 검수·발행 경로

**Files:** scripts/catalog/{schema,validate,import,rollback}.ts, data/catalog/{drafts,approved}/, docs/operations/catalog.md, supabase/migrations/002_catalog_publish.sql, tests/unit/catalog-import.test.ts, tests/integration/catalog-publish.test.ts.

**Interfaces:** Consumes Task 1 types. Produces `validateCatalog(input:unknown): {ok:true; batch:ApprovedCatalogBatch}|{ok:false; errors:string[]}`, `publishCatalog(batch:ApprovedCatalogBatch, db:CatalogWritePort):Promise<{releaseId:string}>`, `rollbackCatalog(releaseId:string, db:CatalogWritePort):Promise<void>`. Batch has schemaVersion:1, checkedAt, reviewer, reviewedAt, explicitly listed changes with prior revision IDs, and sources per nutrition/price/image where they differ. Unreviewed files cannot have ApprovedCatalogBatch status.

- [ ] Add failing tests: `expect(validateCatalog(unreviewed).ok).toBe(false)`; negative nutrients and non-ml basis rejected; null remains null; 0 remains 0; duplicate variant rejected; a batch omitting a formerly present product leaves that product unchanged. In DB integration, stale revision causes entire publish to roll back and rollback restores previous values. Run `npm run test -- tests/unit/catalog-import.test.ts tests/integration/catalog-publish.test.ts` and confirm failure.
- [ ] Implement Zod schema and CLI validation. Store approved batches separately; publish explicit changes transactionally through a server-only operator path, with previous values/revision in release history. Support explicit discontinued updates, never infer them from absence. Document unit anomalies and manual review, no unrestricted scraper.
- [ ] Obtain official sources for all six brands using allowed access; prioritize representative products and document coverage by distinct product, not variant. Preserve source URL/date and image usage provenance. If Twosome/Compose sources remain unavailable, record launch blocker and continue fixture-backed development; do not claim six-brand readiness. Approved values are imported only after human data review; synthetic fixtures remain test-only.
- [ ] Run the two test files and fixture import dry-run; verify release restore in local DB. Commit `feat: add reviewed catalog publication workflow`.

### Task 3: 영양 계산과 공개 도감

**Files:** src/features/catalog/{nutrition,query,repository}.ts, src/features/catalog/components/{DrinkCard,CatalogFilters,DrinkGrid}.tsx and colocated .module.css, src/app/page.tsx, src/app/globals.css, public/images/drinks/placeholder.svg, tests/unit/{nutrition,catalog-query}.test.ts, tests/e2e/catalog.spec.ts.

**Interfaces:** `getNutrition(v:DrinkVariant,basis:Basis):Nutrition`; `parseCatalogQuery(params:URLSearchParams):CatalogQuery`; `listDrinks(q:CatalogQuery):Promise<{items:CatalogItem[];nextCursor:string|null}>`. CatalogQuery defines q, brandIds, category, temperature, basis, nullable maxCalories/maxSugar/maxCaffeine, sort (`name|price|calories|sugar|caffeine`), cursor. CatalogItem joins Drink, selected/default DrinkVariant, brandName, RatingSummary. One card per product; temperature selection resolves a real variant deterministically, no synthesized sizes. Query limits are finite nonnegative numbers; malformed values ignored and invalid cursors restart first page.

- [ ] Add failing assertions: a serving with 200 kcal, 20g sugar, 100mg caffeine at verified 500ml produces `{caloriesKcal:40,sugarG:4,caffeineMg:20}` per 100ml; unknown basis yields all null; missing nutrient remains null; upper bound includes equality and excludes unknown; price remains per cup. Query tests cover trimmed Korean search, null-last sorting, URL script strings treated as text, Infinity/negative/invalid basis, deterministic page boundaries. Run `npm run test -- tests/unit/nutrition.test.ts tests/unit/catalog-query.test.ts` to confirm failure.
- [ ] Implement the functions and database-backed public repository with parameterized queries/RPC, pagination of 24 products. Conversion uses nutritionBasisMl only; filter against unrounded values and round display to one decimal at most. On basis change clear all nutrition bounds and reset paging.
- [ ] Implement C-style catalog and shared app shell using semantic controls, pale neutral background and green accent. Render card details from verified data; failed or absent image uses own SVG. Show source date, missing values, rating count or ‘평가 없음’. Search/filter state lives in URL, with empty/loading/error views and reset. Add category and HOT/ICE filters; no fabricated product data in production.
- [ ] E2E asserts composite filters, basis switch clearing bounds, back navigation restoring query, unavailable image fallback, keyboard usability and no page overflow at 390/1280px. Run unit tests, `npm run test:e2e -- tests/e2e/catalog.spec.ts`, typecheck. Commit `feat: build searchable nutrition catalog`.

### Task 4: 음료 상세와 3개 비교

**Files:** src/app/drinks/[slug]/page.tsx, src/app/compare/page.tsx, src/features/compare/selection.ts, src/features/compare/components/{CompareTray,CompareTable}.tsx, src/features/catalog/components/VariantSelector.tsx, tests/unit/compare-selection.test.ts, tests/e2e/compare.spec.ts.

**Interfaces:** `resolveComparison(ids:string[]):Promise<{items:CatalogItem[];unavailableIds:string[]}>`; `addToComparison(ids:string[],variantId:string):{ids:string[];reason:'added'|'duplicate'|'full'}`. Store up to 3 unique variant IDs in versioned localStorage `hancup.compare.v1`, read only client-side; malformed storage resets safely. Shared nutrient presentation consumes getNutrition.

- [ ] Add failing tests: adding a fourth returns reason full with original 3 intact; duplicate unchanged; different variants of same product allowed; invalid/deleted variant reports unavailable; discontinued variant shown with status and valid reference; corrupt localStorage resets; compare URL deduplicates/truncates untrusted IDs. Run `npm run test -- tests/unit/compare-selection.test.ts` and confirm failure.
- [ ] Implement detail lookup, real variant selector, full available nutrients and field-specific price/nutrition provenance. Unknown slug returns 404. Discontinued detail remains accessible with status; no fabricated variants. Metadata and image alt text describe real product.
- [ ] Implement persistent tray, remove/replace controls and two-or-three-column comparison. One selection prompts adding another. Keep labels fixed in horizontally scrolling table; page itself must not overflow. Basis affects nutrient rows only. Place wishlist/review/map entry points for later tasks without pretend success interactions.
- [ ] E2E: anonymous selection survives reload, fourth-item message, same-product variant comparison, missing and discontinued IDs, serving/100ml with price unchanged. Run unit/E2E, typecheck; commit `feat: add drink detail and three-way comparison`.

### Task 5: 카카오 인증과 찜

**Files:** src/app/login/page.tsx, src/app/auth/callback/route.ts, src/lib/auth/{session,redirect}.ts, src/features/favorites/service.ts, src/features/favorites/components/FavoriteButton.tsx, src/app/me/favorites/page.tsx, supabase/migrations/003_auth_favorites.sql, supabase/tests/favorites_access.sql, tests/unit/auth-redirect.test.ts, tests/e2e/favorites.spec.ts, docs/operations/auth.md.

**Interfaces:** `requireUser():Promise<{id:string}>` (server); `safeReturnTo(value:string|null):string`; `setFavorite(drinkId:string,enabled:boolean):Promise<void>` uses current session, never client-supplied user ID. `listMyFavorites():Promise<CatalogItem[]>`. Profile provisioning uses identity UUID and service nickname, not email availability.

- [ ] Add failing tests: `safeReturnTo('https://evil.example') === '/'`, protocol-relative URLs also '/', valid '/me/favorites' preserved. DB tests assert A cannot read/write B's favorites and anonymous writes fail. E2E fixture auth tests favorite add/remove idempotently and discontinued saved item remains visible. Run the affected tests and confirm failure.
- [ ] Implement Supabase SSR session validation and OAuth callback with allowlisted relative redirects. Kakao is the only login provider; canceled/expired login returns readable retry state. Do not store provider tokens in app logs or expose them in page data. Provision nickname without assuming email, support nickname editing with length 2–20 and plain text display.
- [ ] Add login-on-write prompt and return path; do not promise saved favorite until DB succeeds. Implement personal navigation, favorites, sign-out. Configure real Kakao/Supabase apps only when account access is available; list exact dashboard callback/domain/consent requirements in auth.md. Development session fixtures never ship enabled in production.
- [ ] Run RLS, redirect and favorites tests, typecheck; real OAuth manual check waits for configured credentials and is a release gate. Commit `feat: add kakao login and private favorites`.

### Task 6: 반복 기록·공개 후기·정확한 평점

**Files:** src/features/reviews/{schema,service,repository}.ts, src/features/reviews/components/{ReviewForm,PublicReviews,ReviewActions}.tsx, src/app/me/records/page.tsx, src/app/me/settings/page.tsx, src/app/api/account/route.ts, supabase/migrations/004_reviews.sql, supabase/tests/reviews_access.sql, tests/unit/review-schema.test.ts, tests/integration/review-ratings.test.ts, tests/e2e/reviews.spec.ts, docs/operations/moderation.md.

**Interfaces:** `ReviewInput { drinkId:string;variantId:string|null;rating:number;body:string;consumedOn:string;visibility:'private'|'public' }`; `validateReview(input:unknown,now:Date):ReviewInput`; `createReview(input):Promise<{id:string}>`, `updateReview(id,input):Promise<void>`, `deleteReview(id):Promise<void>`, `listMyRecords(cursor?):Promise<{items:OwnReview[];nextCursor:string|null}>`, `listPublicReviews(drinkId,cursor?):Promise<{items:PublicReview[];nextCursor:string|null}>`, `getRatingSummary(drinkId):Promise<RatingSummary>`. PublicReview includes nickname and review content/date/optional variant but no account identifiers or private profile fields. Query page size 20.

- [ ] Add failing schema tests: 0,6,1.5 rejected; 1/5 accepted; 1000 chars accepted, 1001 rejected; empty body valid; missing visibility becomes private; fixed now at `2026-11-12T15:00:00Z` accepts consumedOn '2026-11-13' and rejects '2026-11-14' regardless host TZ. Run `npm run test -- tests/unit/review-schema.test.ts` and confirm failure.
- [ ] Add failing DB tests with A(public 2, then public 4, then private 1), B(public 2): summary = average 3.0,count 2. Making A's 4 private gives average 2.0,count 2; hiding or deleting A's remaining public record gives average 2.0,count 1; deleting B gives average null,count 0. Editing consumed date does not change selection. Same timestamp tie uses ID. A cannot mutate B or see B private/hidden records; users cannot self-unhide or grant operator role. Run DB/integration tests to confirm failure.
- [ ] Implement validation both server-side and database constraints; immutable created_at and ownership. DB computes summary over latest eligible record per user/product ordered created_at DESC,id DESC. Public reads query only current visible records. Use security-invoker access or narrowly scoped secure RPC with fixed search_path and minimized grants; never return raw private records for client filtering. Do not cache public review content or aggregates persistently in MVP. Own pages and authenticated payloads are private/no-store. Invalidate/refetch public UI after mutations and on focus so visibility changes do not repopulate stale content.
- [ ] Implement form defaults, create/edit/delete/privacy controls and records sorted consumed_on DESC,created_at DESC. Show latest public user contribution count in summary and all eligible public history in list. No file input or upload endpoint. Add authenticated report action (reason max 500 chars, one report per reporter/review); allow only current public records. Operator hide command via server-side script `scripts/moderate-review.ts` records reason, excludes summary and leaves owner-visible moderation status. Moderation is operator-owned, not a client-editable review field.
- [ ] Add account deletion server endpoint requiring current verified session and explicit UI confirmation. Delete current auth user with server admin client, cascade profile/favorites/reviews/reports, and recompute summary dynamically; unlink Kakao connection per current provider guidance without deleting the Kakao account. Document partial failure/retry handling. Add E2E for account deletion and ensure foreign users unaffected.
- [ ] Two-session E2E: viewer opens public review; owner makes private; viewer refocus/refetch receives no review or aggregate contribution, direct API fetch also denies it. Test hidden-review exclusion, date edits, error retries, logout blocking personal routes. Run schema/DB/integration/E2E tests; commit `feat: add private journals and public drink ratings`.

### Task 7: 주변 브랜드 매장 지도

**Files:** src/features/stores/{types,kakao,search}.ts, src/features/stores/components/{StoreSearch,StoreMap,StoreList}.tsx, src/app/stores/page.tsx, src/app/api/stores/route.ts, tests/unit/store-search.test.ts, tests/e2e/stores.spec.ts, docs/operations/maps.md.

**Interfaces:** `Store { id:string;name:string;address:string;phone:string|null;lat:number;lng:number;distanceM:number|null;placeUrl:string }`; `searchStores(input:{brandId:BrandId;lat?:number;lng?:number;region?:string;page?:number},fetcher?:typeof fetch):Promise<{items:Store[];hasNext:boolean}>`. Region search resolves an area then searches selected brand; geographic and region input have deterministic precedence (explicit region wins). Never accept arbitrary client query/URL or forward arbitrary keys.

- [ ] Add failing tests for brand mapping (including 메가MGC/메가엠지씨 names), unrelated keyword match exclusion, invalid coordinates/brand/too-long region rejection, empty results, upstream timeout and 429 mapped to recoverable unavailable, no key or precise location logged. Run `npm run test -- tests/unit/store-search.test.ts` and confirm failure.
- [ ] Implement Kakao server adapter with 5-second timeout, bounded paging and application-wide request budget plus per-client throttle. Free-quota values are configuration from actual app policy, not a guessed promise. Keys stay server-side, responses project only required fields. Do not persist user coordinates or full Kakao result database; do not cache outside permitted terms. Map SDK loads only on stores screen with browser key restricted to app domains.
- [ ] Implement selected-brand map/list coordination, explicit current-position button, district search, distances when available and Kakao route links. Permission denied/insecure context/SDK blocked/API failure produces useful text and external Kakao search link. Do not label a store as currently selling the product or currently open based on guesses.
- [ ] E2E with mocked upstream: permission denied then region search; 429 with fallback; empty results; malicious name rendered as text; route link uses validated Kakao URL and encoded data. Manual real-map free-quota/config check remains release gate. Run tests and typecheck; commit `feat: find nearby brand stores`.

### Task 8: 전체 여정·운영·배포

**Files:** tests/e2e/{journeys,accessibility}.spec.ts, README.md, docs/operations/{deployment,backup,release-checklist}.md, src/app/{error,not-found,loading}.tsx, src/app/robots.ts, src/app/sitemap.ts, .github/workflows/ci.yml, scripts/backup.ts.

**Interfaces:** Consumes all prior tasks. CI runs lint, typecheck, unit, local DB access tests, build and browser journeys with test-only data/auth in an isolated environment. Production never falls back to mocked login/catalog success.

- [ ] Add E2E journeys for anonymous search/filter→3-way comparison→detail→brand map; logged-in favorite→repeat journal→privacy change→personal history. Assert unknown values never display as zero, missing image works, free-service failure is visible, private pages excluded from sitemap/robots. Run new tests and confirm any uncovered failure before fixing it.
- [ ] Verify keyboard order, focus after dialogs, labeled controls, color contrast, accessible table, alt text, 390px and desktop layout against C reference. Fix only observed failures. Add SEO metadata/sitemap for public active drinks, generic private-page metadata and no sensitive data in logs or static HTML.
- [ ] Implement restricted backup/export and restore instructions for catalog and user data, with local dumps ignored by Git and never attached to public artifacts. Document weekly catalog review, source/date checks, moderation, account deletion, free-quota monitoring, inactive DB recovery and rollback to previous code/data release. Smoke-test local restore.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:db`, `npm run build`, `npm run test:e2e`. Record actual commands/results and remaining external checks in release-checklist.md. CI must pass with no dependency on personal production credentials.
- [ ] Configure user-owned Supabase, Kakao and Vercel when authorized access is available; use secret settings, not chat or Git. Confirm personal/non-commercial eligibility, actual Kakao free quota, callback/domain allowlists, six-brand verified data, and product image provenance. Use Vercel supplied domain and no paid overage. Before public production deployment present working preview, evidence and remaining launch constraints for approval; never claim externally configured services work from mocks alone.
- [ ] After deployment authorization, deploy and verify actual anonymous journey plus real Kakao login, private/public mutation, map and sign-out. If launch data or credentials are unavailable, deliver a runnable local implementation with explicit blocked release checks, not a false deployed claim. Commit `chore: verify and prepare hancup release`.

## 진행 순서와 완료 정의

Tasks 1→2→3→4→5→6→7→8 순서. 데이터 조사에서 막혀도 검증용 fixtures로 개발은 계속할 수 있지만, 실제 공개 출시는 6개 브랜드의 공식 근거 확보가 필요하다. 별도 독립 프로젝트로 나누지 않는 이유는 탐색·개인 기록·지도 모두 같은 제품 ID·변형·인증 계약을 공유하는 하나의 MVP이기 때문이다.

각 작업의 tests는 실패 확인→최소 구현→통과 순서로 실행한다. 도구 설치·스캐폴딩 같은 저위험 설정만을 검사하는 테스트는 추가하지 않는다. 지정 커밋 전 해당 작업의 실제 검증 결과를 확인한다. 전체 성공은 실제 배포와 핵심 외부 연동 확인까지이며, 계획 작성이나 fixture 데모만으로 완료라고 하지 않는다.

## 계획 자체 검토

- 설계 대응: Task 2가 출처·검수·종료·사진 대체를, Tasks 3–4가 C UI·영양·가격·비교를, Tasks 5–6이 인증·찜·반복 기록·공개 규칙·운영을, Task 7이 매장을, Task 8이 무료 배포·운영·접근성을 담당한다.
- 리뷰 위험 5개 각각에 소유 작업과 구체적 테스트가 있다. 함수/필드 계약은 위 Interfaces를 공통으로 사용한다.
- 수량 20~30종은 목표이며 확정 의무가 아니다. 생산 데이터 확보·실제 외부 계정 설정은 출시 게이트로 보존한다.
- 승인 상태: 설계 승인 완료. 사용자가 직접 구현을 승인했고 로컬 MVP 구현·검증과 독립 리뷰 수정을 완료했다. 외부 계정·공식 데이터·공개 배포는 출시 게이트로 남아 있다.
