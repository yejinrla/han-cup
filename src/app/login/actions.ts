"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { safeReturnTo } from "@/lib/auth/redirect";
export async function login(form: FormData) {
  const db = await serverClient();
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(h.get("origin") ?? "http://localhost:3000").origin;
  const next = safeReturnTo(form.get("next") as string);
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}
export async function signOut() {
  const db = await serverClient();
  await db.auth.signOut();
  redirect("/");
}
