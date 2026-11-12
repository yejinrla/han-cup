# Supabase와 카카오 로그인

1. 사용자가 소유한 Supabase Free 프로젝트를 생성한다. 카카오 앱도 같은 사용자 소유로 준비한다. 계정 생성 시 약관 동의는 사용자가 직접 한다.
2. Supabase SQL Editor 또는 CLI migrations로 `001_core.sql`, `004_reviews.sql`, `005_map_budget.sql`, `006_account_deletion.sql`을 순서대로 적용한다. 기본 권한을 명시적으로 회수하고 필요한 열만 허용하므로 RLS와 GRANT를 모두 유지한다.
3. Supabase Auth의 Kakao provider를 켜고 REST API 키/Client Secret은 그 공급자 설정에 입력한다. Supabase가 안내하는 `/auth/v1/callback`을 Kakao Developers Redirect URI에 등록한다.
4. Supabase의 Site URL과 Redirect URLs에 한컵 실제 도메인의 `/auth/callback`을 허용한다. `.env.local` 또는 Vercel secret settings에서 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL을 설정한다. SITE_URL은 정확한 서비스 origin이다.
5. Kakao account_email이 불필요하면 수집하지 않는다. Supabase Kakao provider의 이메일 없는 사용자 허용 설정을 공식 문서에 따라 확인한다. 공개 닉네임은 한컵에서 별도로 관리한다.
6. 서비스 권한 키 SUPABASE_SERVICE_ROLE_KEY는 서버 전용이다. 클라이언트 번들에 NEXT_PUBLIC 접두사로 넣지 않는다. 지도 공유 예산과 계정 삭제에 사용한다.
7. 탈퇴 시 카카오 서비스 연결 해제를 위해 **같은 Kakao 앱의** KAKAO_ADMIN_KEY를 서버에 설정한다. 현재 검증된 사용자 identity의 Kakao sub를 사용하며 클라이언트 target_id를 받지 않는다. 최근 10분 내 로그인과 확인 문구를 요구한다. 연결 해제 성공 상태를 전용 비공개 테이블에 보존하여 DB 삭제 실패 시 재시도한다. 네트워크 성공 직후 상태 저장이 실패하는 드문 경우는 운영자가 Kakao 연결 상태를 확인한 뒤 재시도 상태를 정정해야 한다. Kakao 계정 자체는 삭제하지 않는다.

실제 배포 도메인에서 로그인, 취소, 만료 세션 갱신, 로그아웃, 다른 계정 비공개 접근 차단을 검증한다. 로컬 테스트 성공으로 Kakao OAuth를 검증했다고 주장하지 않는다.

공식 참고: https://supabase.com/docs/guides/auth/social-sign-in/auth-kakao · https://developers.kakao.com/docs/ko/kakaologin/rest-api
