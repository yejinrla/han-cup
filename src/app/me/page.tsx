import Link from "next/link";
import { UserRound, Settings, ChevronRight, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireUser("/me");
  const db = await serverClient();
  const { data, error } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("프로필을 불러오지 못했어요.");
  return (
    <main id="main" className="page-wrap my-page">
      <h1 className="page-heading">마이페이지</h1>
      <p className="page-intro">나의 취향을 담은 한컵.</p>
      <section className="panel my-profile" aria-label="내 프로필">
        <span className="my-avatar" aria-hidden="true">
          <UserRound size={28} />
        </span>
        <div>
          <h2>{data.nickname}</h2>
          <p>오늘도 나다운 한 잔을 찾아보세요.</p>
        </div>
      </section>
      <Link href="/me/settings" className="my-settings-link">
        <Settings size={20} aria-hidden="true" />
        <span>프로필·계정 설정</span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
      <form action={signOut}>
        <button type="submit" className="my-logout">
          <LogOut size={18} aria-hidden="true" /> 로그아웃
        </button>
      </form>
    </main>
  );
}
