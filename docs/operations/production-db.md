# 운영 DB 적용 상태

기준일: 2026-11-14 (한국 시간). 운영 Supabase 프로젝트의 SQL은 사용자가 SQL Editor에서 직접 실행한다. 이 문서는 무엇이 적용됐는지와 다음 마이그레이션을 어떻게 적용할지 기록한다. 운영 DB 비밀번호·키는 저장소와 채팅에 남기지 않는다.

## 적용됨

| 내용 | 파일 | 확인 근거 |
|---|---|---|
| 초기 스키마(001·004·005·006) | `supabase/setup.sql` | 확인 쿼리 `setup_applied = true` |
| 초기 공개 도감 | `supabase/initial-catalog.sql` | 운영 도감 표시 |
| 발견 홈 인기 집계(007) + 메가 겨울 신메뉴 3종 | `supabase/enable-discovery.sql` | `discovery_applied = true`, `winter_drinks = 3`, `/api/discovery/popular` `available: true` (2026-11-14) |
| 아티클 좋아요(008) | `supabase/migrations/008_article_favorites.sql` | `article_likes_applied = true` (2026-11-14). 로그인 후 동작 확인은 아직 기록 없음 |

## 적용 필요

| 내용 | 파일 | 상태 |
|---|---|---|
| 기록의 커스텀 옵션(009) | `supabase/migrations/009_review_options.sql` | 아직 운영에 적용 안 됨. **코드를 배포하기 전에** SQL Editor에서 전체 실행한다. 재실행 가능, 기존 기록은 옵션 없음(빈 목록)으로 유지된다. 적용 전에 코드가 배포되면 새 기록 저장과 수정이 실패한다. |

009 확인 쿼리 (읽기 전용):

```sql
select
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'reviews'
            and column_name = 'options')                       as options_column,
  to_regprocedure('public.review_options_valid(text[])') is not null as options_rule,
  (select pg_get_function_result('public.public_reviews(uuid,integer)'::regprocedure)
     like '%options%')                                        as public_reviews_has_options;
```

세 값이 모두 true면 적용된 것이다. 적용 후 이 표를 "적용됨"으로 옮기고 날짜를 적는다.

새 프로젝트용 `setup.sql`은 006까지만 담고 있다. 새 프로젝트를 만들면 `setup.sql` 다음에 007(또는 `enable-discovery.sql`), 008, 009를 차례로 실행한다.

## 다시 실행하지 않는 파일

- `setup.sql`, `initial-catalog.sql`: 새 프로젝트용 초기 설정이다. 재실행용이 아니다.
- `migrations/001`·`004`·`005`·`006`: `setup.sql`에 포함돼 있다.
- `migrations/007_home_popularity.sql`, `import-mega-winter.sql`: 내용 전체가 `enable-discovery.sql`에 들어 있다.

## 확인 쿼리 (읽기 전용)

```sql
select
  to_regclass('public.reviews')              is not null as setup_applied,
  to_regprocedure('public.popular_drinks()') is not null as discovery_applied,
  (select count(*) from public.drinks
    where slug in ('mega-deep-chocolate-cherry-frappe',
                   'mega-chewy-mochi-milk-tea',
                   'mega-green-plum-quince-tea')) as winter_drinks,
  to_regclass('public.article_favorites')    is not null as article_likes_applied;
```

## 다음 마이그레이션을 추가할 때

- `supabase/migrations/`에 다음 번호(009부터)로 추가하고, 기존 프로젝트에 다시 실행해도 안전하게(`IF NOT EXISTS`, `CREATE OR REPLACE`, 트랜잭션) 쓴다.
- 적용 방법과 확인 방법을 운영 문서에 적고, 사용자가 실행한 뒤 이 표에 날짜와 근거를 추가한다. 실행되지 않은 설정을 완료로 적지 않는다.
