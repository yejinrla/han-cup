import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { configured, serverClient } from "@/lib/supabase/server";
// Request-scoped React render memoization; never persist authentication across requests.
export const currentUser = cache(async () => {
  if (!configured()) return null;
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  return error ? null : user;
});
export async function requireUser(next = "/me/records") {
  const user = await currentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent(next));
  return user;
}
