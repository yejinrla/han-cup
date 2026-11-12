# 신메뉴 등록 검수안 — 메가MGC커피 겨울 음료

2026-11-12 사용자가 채팅에서 "검수안대로 3종 등록"으로 승인했다. 신메뉴 노출 목록과 미연결 환경의 초기 데이터에 반영했으며, 운영 DB에는 SQL Editor에서 등록해야 한다.

| 음료 | 온도 | 컵 용량 | kcal | 당류 g | 카페인 mg |
|---|---|---:|---:|---:|---:|
| 딥 초코 체리 프라페 | ICE | 591ml | 604 | 90.7 | 26 |
| 쫀득 모찌 밀크티 | ICE | 591ml | 375.3 | 46.4 | 14.2 |
| 매실 모과차 | HOT | 591ml | 276.6 | 54.9 | 0 |

- [공식 메뉴·영양정보](https://www.mega-mgccoffee.com/menu/?menu_category1=1&menu_category2=1). 메뉴 화면이 불러오는 공개 `menu.php` 응답에서도 같은 수치를 대조했다. 확인일2026-11-12.
- [공식 사이트 겨울 신메뉴 출시 공지](https://www.mega-mgccoffee.com/bbs/detail/?YmJzX2lkeD03MTAmYmJzX2NhdGVnb3J5PTcmYmJzX2RldGFpbF9jYXRlZ29yeT0mYmJzX3BhZ2U9MQ=%3D): 2026-10-29 출시 발표. 출시 표시는 이 공지 기준이다.
- [공식 겨울 신메뉴 프로모션](https://www.mega-mgccoffee.com/bbs/detail/?YmJzX2lkeD03MDgmYmJzX2NhdGVnb3J5PTMmYmJzX2RldGFpbF9jYXRlZ29yeT0mYmJzX3BhZ2U9MQ=%3D): 겨울 신메뉴3종과 10/29부터의 행사 일정을 확인했다. 행사별 날짜를 개별 출시일로 추정하지 않는다.
- 컵 용량과 영양 제공량의 관계를 추정하지 않으므로 100ml 환산은 제공하지 않는다. 가격은 행사가/정상가 혼동을 피하려고 미제공으로 둔다. 사진 사용 권한이 없어 기존 자체 일러스트를 쓴다.
- 매실 모과차는 우선 HOT 대표 변형만 등록하는 안이다. ICE 수치를 임의로 복사하지 않는다.

승인 후 실행할 파일: `supabase/enable-discovery.sql`. 기존 음료를 덮어쓰지 않는 추가 등록이다. API 키나 DB 비밀번호는 채팅에 보내지 않는다.
