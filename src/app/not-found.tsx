import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="page-wrap">
      <div className="empty-state">
        <h1 className="page-heading">이 한 잔을 찾지 못했어요</h1>
        <p>주소를 확인하거나 도감에서 다른 음료를 만나보세요.</p>
        <Link className="primary-button" href="/">
          음료 도감으로
        </Link>
      </div>
    </main>
  );
}
