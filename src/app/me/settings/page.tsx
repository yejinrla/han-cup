import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/features/account/SettingsForm";
import { signOut } from "@/app/login/actions";
export const metadata = {
  title: "계정 설정",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Settings() {
  const user = await requireUser("/me/settings");
  const db = await serverClient();
  const { data, error } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("계정 정보를 불러오지 못했어요.");
  return (
    <main id="main" className="page-wrap" style={{ maxWidth: 700 }}>
      <p className="eyebrow">MY HANCUP</p>
      <h1 className="page-heading">계정 설정</h1>
      <nav className="personal-tabs">
        <Link href="/me/records">마신 기록</Link>
        <Link href="/me/favorites">좋아요한 음료</Link>
        <Link href="/me/settings">계정 설정</Link>
      </nav>
      <SettingsForm nickname={data.nickname} />
      <form action={signOut} style={{ marginTop: 25 }}>
        <button className="text-button">로그아웃</button>
      </form>
    </main>
  );
}
