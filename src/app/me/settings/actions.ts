"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { z } from "zod";
import { redirect } from "next/navigation";
export async function updateNickname(
  _state: { message?: string },
  form: FormData,
) {
  const user = await requireUser("/me/settings");
  const p = z.string().trim().min(2).max(20).safeParse(form.get("nickname"));
  if (!p.success) return { message: "닉네임은 2~20자로 입력해 주세요." };
  const db = await serverClient();
  const { error } = await db
    .from("profiles")
    .update({ nickname: p.data })
    .eq("id", user.id);
  if (error) return { message: "닉네임을 저장하지 못했어요." };
  revalidatePath("/", "layout");
  return { message: "닉네임을 변경했어요." };
}
export async function reauthenticate() {
  await requireUser("/me/settings");
  const db = await serverClient();
  if (!process.env.NEXT_PUBLIC_SITE_URL)
    throw new Error("서비스 주소 설정이 필요합니다.");
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback?next=/me/settings",
      queryParams: { prompt: "login" },
    },
  });
  if (error || !data.url) throw new Error("다시 로그인할 수 없어요.");
  redirect(data.url);
}
