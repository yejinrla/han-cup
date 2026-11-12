import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { AppNavigation } from "@/components/AppNavigation";
import { Header } from "@/components/Header";
import { CompareTray } from "@/features/compare/components/CompareControls";
export const metadata: Metadata = {
  title: { default: "한컵 · 취향을 발견하는 음료 도감", template: "%s · 한컵" },
  description:
    "여러 카페의 음료를 한곳에서 찾아보고, 영양정보로 비교하고, 나만의 한 잔을 기록하세요.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafbf7",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <div className="app-shell">
          <Header />
          {children}
          <footer className="site-footer">
            <div className="wordmark">
              한컵<span>.</span>
              <small>HANCUP</small>
            </div>
            <p>한 잔씩 발견하는, 나만의 취향.</p>
            <div>
              <Link href="/about">서비스 소개</Link>
              <Link href="/privacy">개인정보 처리방침</Link>
              <small>© 2026 HanCup</small>
            </div>
          </footer>
          <CompareTray />
          <AppNavigation />
        </div>
      </body>
    </html>
  );
}
