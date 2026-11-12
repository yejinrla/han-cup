import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Heart,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
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
        <nav aria-label="주 메뉴">
          <Link href="/" className="nav-catalog">
            <BookOpen size={16} />
            음료 도감
          </Link>
          <Link href="/stores">
            <MapPin size={16} />
            주변 매장
          </Link>
          <Link href="/me/favorites">
            <Heart size={16} />
            좋아요한 음료
          </Link>
          <Link href="/me/records">
            <CalendarDays size={16} />
            나의 한컵
          </Link>
        </nav>
        <Link href="/login" className="login-link">
          카카오로 시작하기 <ArrowUpRight size={14} />
        </Link>
      </header>
    </>
  );
}
