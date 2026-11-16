# 공개 후기 운영

신고는 로그인 사용자가 공개·운영 노출 중인 후기에만 남기며 한 사용자·후기당 하나다. 내용은 1~500자. 신고 목록은 일반 클라이언트에 노출하지 않는다. 운영자는 Supabase 대시보드에서 확인한다.

서버 운영 환경에서 `npx tsx scripts/moderate-review.ts 후기UUID hidden 운영자UUID '숨김 사유'` 실행. 되돌리기는 visible. 운영자 UUID는 operator_roles에 미리 등록되어 있어야 한다. 일반 사용자가 자기 프로필을 고쳐 운영자가 될 수 없다. service-role 키는 운영자만 보유하고 로그에 출력하지 않는다.

운영 숨김은 기록을 삭제하지 않는다. 작성자는 자신의 숨김 상태·사유를 확인할 수 있다. 공개 목록과 평균 평점은 숨김 기록을 제외한다. 최신 공개 기록이 제외되면 해당 사용자의 다음 최신 공개 기록이 평점에 반영될 수 있다. 공개 후기 본문은 서버 컴포넌트 페이지 캐시에 포함하지 않고 no-store API로 읽는다. 페이지 이탈 시 지우고, 뒤로가기·창 포커스 복귀 시 최신 공개 조회가 끝나기 전에는 표시하지 않는다.

## 주 1회 신고 확인 (2026-11-16 결정)

신고는 운영자에게 알림이 가지 않고, 신고 수가 쌓여도 자동으로 숨기지 않는다(악용 방지, 무료 운영). 대신 운영자가 주 1회 Supabase SQL Editor에서 아래 읽기 전용 쿼리로 확인한다. 공개 노출 중인 후기에 들어온 신고만 신고 수가 많은 순으로 보인다.

```sql
select r.id                       as review_id,
       count(rr.*)                as reports,
       max(rr.created_at)         as last_reported,
       left(r.body, 80)           as body_preview,
       array_agg(left(rr.reason, 60) order by rr.created_at desc) as reasons
from public.review_reports rr
join public.reviews r on r.id = rr.review_id
where r.visibility = 'public' and r.moderation_status = 'visible'
group by r.id, r.body
order by reports desc, last_reported desc;
```

숨길 후기는 위의 `moderate-review.ts`로 처리하고 사유를 남긴다. 신고량이 늘어 주 1회로 부족해지면 자동 숨김이나 알림을 다시 검토한다.
