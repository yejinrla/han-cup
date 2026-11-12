# 한컵 · HanCup

여러 카페의 음료를 탐색하고 영양정보·가격으로 비교하며, 마신 경험을 공개 또는 비공개로 기록하는 반응형 웹서비스.

## 실행

Node.js 24 LTS에서 `npm ci`, `npm run dev`. http://localhost:3000 에서 연다.
환경 키 없이도 **공식 자료를 대조한 초기 공개 음료 데이터**로 도감·검색·영양 필터·비교를 사용할 수 있다. 현재 초기 자료는 4개 브랜드 16개 제품이며, 6개 브랜드 전체 출시 데이터가 아니다. 후기는 가짜 계정이나 브라우저 저장소로 흉내 내지 않는다. Supabase/Kakao 설정이 없으면 실제 인증·저장·지도 연결 준비 안내를 표시한다.

## 외부 연결

`.env.example`를 `.env.local`로 복사하여 공급자 대시보드에서 발급한 값을 직접 설정한다. 키를 채팅·Git·스크린샷에 노출하지 않는다. 문서:

- [인증·DB](docs/operations/auth.md)
- [공식 데이터와 검수](docs/operations/catalog.md)
- [지도와 무료 한도](docs/operations/maps.md)
- [배포·출시 조건](docs/operations/deployment.md)
- [백업](docs/operations/backup.md)
- [운영 숨김](docs/operations/moderation.md)

## 검증

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.

DB 테스트는 **폐기 가능한 로컬 PostgreSQL** 전용이다. `docker run -d --name hancup-db -e POSTGRES_PASSWORD=hancup_local_test -p 127.0.0.1:55432:5432 postgres:17` 후 `npm run test:db`. public 스키마를 초기화하므로 운영 DB를 TEST_DATABASE_URL에 절대 지정하지 않는다. 기본 연결은 위 로컬 DB다. 테스트는 실제 PostgreSQL RLS·트랜잭션·집계 함수를 실행한다. Supabase auth.uid는 테스트 환경에서만 최소 어댑터로 제공한다.

브라우저 검증은 기본 `/usr/bin/chromium`; 로컬에 없으면 `npx playwright install chromium` 후 `PLAYWRIGHT_USE_BUNDLED_BROWSER=1 npm run test:e2e`.

## 구조와 현재 상태

Next.js App Router/TypeScript/CSS, Supabase PostgreSQL/Auth, Kakao 로그인·지도, Vitest/Playwright. 승인된 설계와 구현 계획은 `docs/superpowers/`에 있다. 운영 키 연결·공식 데이터 최종 검수·정식 개인정보 처리방침·실제 외부 연동 확인 전에는 공개 출시하지 않는다. 배포는 개인·비상업 Vercel Hobby와 무료 공급량 내 운영을 전제로 하며 자동 유료 전환을 설정하지 않는다.
