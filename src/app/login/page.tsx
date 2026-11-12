import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { configured } from "@/lib/supabase/server";
import { currentUser } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";
import { login } from "./actions";
export const metadata = {
  title: "카카오 로그인",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const p = await searchParams;
  const next = safeReturnTo(p.next ?? null);
  if (await currentUser()) redirect(next);
  return (
    <main id="main" className="page-wrap">
      <div className="auth-card">
        <Link href="/" className="wordmark">
          한컵<span>.</span>
        </Link>
        <h1>나의 한 잔을 모으는 곳</h1>
        <p>
          마셔보고 싶은 음료를 저장하고,
          <br />
          오늘의 한 잔을 나만의 기록으로 남겨요.
        </p>
        {!configured() && (
          <div className="status-box">
            카카오 로그인 연결을 준비하고 있어요.
            <br />
            음료 탐색과 비교는 지금도 이용할 수 있습니다.
          </div>
        )}
        {p.error && (
          <p className="inline-error" role="alert">
            로그인을 완료하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <form action={login}>
          <input name="next" type="hidden" value={next} />
          <button className="kakao-button" disabled={!configured()}>
            <MessageCircle
              size={16}
              fill="currentColor"
              style={{ marginRight: 10 }}
            />
            카카오로 시작하기
          </button>
        </form>
        <p>
          로그인에 필요한 계정 정보만 사용합니다.
          <br />
          기록은 기본적으로 나만 볼 수 있어요.
        </p>
        <Link className="text-button" style={{ marginTop: 25 }} href="/search">
          로그인 없이 둘러보기 →
        </Link>
      </div>
    </main>
  );
}
