import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
        <Link
          href="/login"
          className="login-link"
          aria-label="로그인 · 카카오로 시작하기"
        >
          로그인 <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </header>
    </>
  );
}
