# 백업과 복원

운영 DB에는 사용자 개인 기록이 있다. 백업을 Git·공개 링크·리뷰 첨부에 넣지 않는다. 공급자 Free에 자동 백업이 있다고 가정하지 않는다.

PostgreSQL 17 pg_dump 도구와 DATABASE_URL을 서버 환경에 설정한 뒤 `npx tsx scripts/backup.ts`. 파일은 Git에서 제외한 `backups/`에 0600 권한으로 저장된다. 사용자 데이터를 포함한 운영 백업은 암호화된 별도 저장소에 제한된 운영자만 보관하고, 정식 개인정보 처리방침에서 보유·삭제 기간을 정한다. 로컬 파일만 두면 장비 장애에 취약하다.

복원 연습은 **새로운 폐기 가능한 DB**에 `pg_restore --no-owner --dbname=복원테스트DB backups/파일.dump`로 한다. 운영 DB를 덮어쓰지 않는다. 로컬 Docker만 있다면 `docker exec hancup-db pg_dump -U postgres -Fc hancup_auth` 결과를 제한된 로컬 파일에 저장하고, 새 DB로 입력해 복원을 점검할 수 있다.

데이터 변경 복구는 catalog release 복구와 DB 백업 복원을 구분한다. 정기 백업·복구 연습과 무료 프로젝트 비활성 중지에서 복귀하는 절차를 운영자가 유지한다.
