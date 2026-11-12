export const metadata = {
  title: "개인정보 안내",
  robots: { index: false, follow: true },
};
export default function Privacy() {
  return (
    <main id="main" className="page-wrap prose">
      <p className="eyebrow">YOUR RECORDS, YOUR CHOICE</p>
      <h1 className="page-heading">개인정보 안내</h1>
      <div className="status-box">
        출시 준비용 안내입니다. 실제 운영자·문의처와 공급자 처리 지역을 확정한
        뒤 정식 개인정보 처리방침을 게시합니다. 정식 방침 게시 전 공개 회원
        모집을 시작하지 않습니다.
      </div>
      <h2>로그인과 기록</h2>
      <p>
        카카오 로그인으로 발급된 서비스 사용자 식별자, 서비스 닉네임, 세션, 직접
        작성한 별점·글·마신 날짜·공개 여부와 찜을 계정 기능 제공에 사용합니다.
        후기 사진은 수집하지 않습니다. 공개 후기는 서비스 닉네임과 함께 표시하며
        카카오 계정 식별자와 이메일을 공개하지 않습니다.
      </p>
      <h2>위치 정보</h2>
      <p>
        현재 위치는 버튼을 누르고 권한을 허용한 경우 주변 매장 검색에만
        사용합니다. 위치 좌표를 한컵 DB에 저장하지 않으며, 카카오 매장 검색으로
        전송합니다. 지역명 검색으로도 이용할 수 있습니다.
      </p>
      <h2>삭제와 외부 서비스</h2>
      <p>
        기록을 직접 수정·삭제하거나 공개 여부를 바꿀 수 있습니다. 계정 탈퇴 시
        개인 기록과 찜을 삭제합니다. 인증과 DB는 Supabase, 호스팅은 Vercel,
        로그인과 지도는 카카오를 이용하도록 설계되었습니다. 실제 처리 위탁과
        보유·삭제 기준은 정식 방침에서 확정합니다.
      </p>
    </main>
  );
}
