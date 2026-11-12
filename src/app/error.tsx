"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-wrap">
      <div className="empty-state">
        <h1 className="page-heading">한 잔 쉬어갈까요?</h1>
        <p>정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        <button className="primary-button" onClick={reset}>
          다시 시도
        </button>
        <Link className="text-button" style={{ marginLeft: 20 }} href="/search">
          도감으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
