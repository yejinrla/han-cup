# 실제 로컬 인증 통합 테스트

외부 Kakao 계정 없이도 Supabase가 사용하는 실제 GoTrue와 PostgREST, PostgreSQL로 세션·RLS·저장 흐름을 검증한다. 제품에 테스트 로그인 분기를 넣지 않는다. 테스트 사용자와 자격 증명은 폐기 가능한 로컬 환경에만 존재한다. Kakao OAuth 자체 검증은 별도 출시 게이트다.

1. README의 전용 `hancup-db` 컨테이너를 실행한다.
2. 공식 이미지 `public.ecr.aws/supabase/gotrue:v2.197.0`, `public.ecr.aws/supabase/postgrest:v16.5`를 준비한다. 테스트 스크립트가 같은 이미지로 컨테이너를 실행한다. 외부 접근이 필요한 다운로드는 현재 환경의 프록시·CA를 유지한다.
3. `npx tsx tests/support/start-auth-stack.ts`. 로컬 DB에 hancup_auth를 만들고 인증 테이블/앱 마이그레이션을 적용한다. 이미 있는 운영 프로젝트에 연결하지 않는다. 임시 키는 Git 무시된 `.env.auth-test`에 저장한다.
4. 별도 터미널에서 `npx tsx tests/support/auth-gateway.ts`를 유지한다.
5. `npx playwright test --config playwright.auth.config.ts`. 테스트 서버는 3001 포트, 별도 `.next-auth` 출력 경로를 사용한다. 테스트는 임시 사용자를 만들고 실제 세션 쿠키를 설정하며 종료 시 사용자를 삭제한다.

포트: PostgreSQL 55432, 테스트 게이트웨이 55434, GoTrue 55435, REST 55436. 모든 외부 컨테이너 바인딩은 127.0.0.1. 테스트 앱은 cloud preview용 0.0.0.0이지만 실제 공개 배포는 하지 않는다.

테스트 범위: 찜 저장과 재방문 시 상태 복원, 기본 비공개 기록, 반복 공개 기록, 평균 평점, 공개→비공개 수정 후 익명 페이지와 직접 RPC에서 원문 제외. 브라우저 이력에서 철회된 본문이 다시 보이지 않는지와 응답을 지연시키는 복원·포커스 테스트도 포함한다.

현재 클라우드에서는 전체 Supabase 스택의 큰 PostgreSQL 이미지가 디스크 용량을 초과해 이 가벼운 구성을 사용했다. 이 테스트는 hosted gateway·SMTP·Kakao provider 설정까지 검증한 결과가 아니다.
