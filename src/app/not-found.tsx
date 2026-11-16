import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="page-wrap">
      <div className="empty-state">
        <h1 className="page-heading">페이지를 찾을 수 없어요</h1>
        <p>주소를 확인하거나 도감에서 다른 음료를 만나보세요.</p>
        <Link className="primary-button" href="/search">
          음료 도감으로
        </Link>
      </div>
    </main>
  );
}
