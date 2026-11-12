import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { deleteAccount } from "@/features/account/delete";
export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : new URL(request.url).origin;
  if (origin !== expected)
    return NextResponse.json(
      { error: "요청을 확인할 수 없어요." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  if (
    Date.now() - new Date(user.last_sign_in_at ?? 0).getTime() >
    10 * 60 * 1000
  )
    return NextResponse.json(
      { error: "카카오로 다시 로그인한 뒤 탈퇴를 진행해 주세요." },
      { status: 403 },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "탈퇴 확인 문구를 입력해 주세요." },
      { status: 400 },
    );
  }
  if (body.confirmation !== "한컵 탈퇴")
    return NextResponse.json(
      { error: "확인 문구가 일치하지 않아요." },
      { status: 400 },
    );
  if (!process.env.KAKAO_ADMIN_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json(
      {
        error: "탈퇴 연결 설정을 준비하고 있어요. 잠시 후 다시 시도해 주세요.",
      },
      { status: 503 },
    );
  const identity = user.identities?.find((x) => x.provider === "kakao");
  const kakaoId = String(
    identity?.identity_data?.sub ?? identity?.identity_data?.provider_id ?? "",
  );
  if (!/^\d+$/.test(kakaoId))
    return NextResponse.json(
      { error: "카카오 계정 연결을 확인하지 못했어요." },
      { status: 409 },
    );
  try {
    const admin = adminClient();
    await deleteAccount(user.id, kakaoId, {
      isUnlinked: async (id) => {
        const { data, error } = await admin
          .from("account_deletions")
          .select("unlink_completed")
          .eq("user_id", id)
          .maybeSingle();
        if (error) throw error;
        return data?.unlink_completed === true;
      },
      unlink: async (target) => {
        const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
          method: "POST",
          headers: {
            Authorization: "KakaoAK " + process.env.KAKAO_ADMIN_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            target_id_type: "user_id",
            target_id: target,
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("연결 해제 실패");
      },
      markUnlinked: async (id) => {
        const { error } = await admin
          .from("account_deletions")
          .upsert({
            user_id: id,
            unlink_completed: true,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
      },
      remove: async (id) => {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
      },
    });
    const db = await serverClient();
    await db.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "탈퇴를 완료하지 못했어요. 다시 시도해 주세요. 일부 연결이 해제됐다면 운영자에게 문의해 주세요.",
      },
      { status: 503 },
    );
  }
}
