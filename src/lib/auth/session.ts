import "server-only";
import { redirect } from "next/navigation";
import { configured, serverClient } from "@/lib/supabase/server";
export async function currentUser() {
  if (!configured()) return null;
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  return error ? null : user;
}
export async function requireUser(next = "/me/records") {
  const user = await currentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent(next));
  return user;
}
