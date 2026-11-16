import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth/session";
import { signOut } from "@/app/login/actions";
export function Header() {
  return (
    <>
      <a className="skip" href="#main">
        본문으로 이동
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="한컵 홈">
          한컵<span>.</span>
          <small>HANCUP</small>
        </Link>
        <span className="app-header-note">한 잔씩, 나의 취향</span>
        <Suspense
          fallback={
            <span className="header-auth-placeholder" role="status">
              <span className="sr-only">로그인 상태 확인 중</span>
            </span>
          }
        >
          <HeaderAuthControl />
        </Suspense>
      </header>
    </>
  );
}

async function HeaderAuthControl() {
  const user = await currentUser();
  if (user) {
    return (
      <form action={signOut}>
        <button type="submit" className="login-link">
          로그아웃 <LogOut size={15} aria-hidden="true" />
        </button>
      </form>
    );
  }
  return (
    <Link
      href="/login"
      className="login-link"
      aria-label="로그인 · 카카오로 시작하기"
    >
      로그인 <ArrowUpRight size={13} aria-hidden="true" />
    </Link>
  );
}
