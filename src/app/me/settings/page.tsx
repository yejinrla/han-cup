import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/features/account/SettingsForm";
import { ArrowLeft } from "lucide-react";
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
    <main id="main" className="page-wrap">
      <Link href="/me" className="taste-note-back">
        <ArrowLeft size={15} aria-hidden="true" /> 마이페이지로
      </Link>
      <h1 className="page-heading">계정 설정</h1>
      <SettingsForm nickname={data.nickname} />
    </main>
  );
}
