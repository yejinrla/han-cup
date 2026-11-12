import "server-only";
import { currentUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
export async function getFavoriteIds() {
  const user = await currentUser();
  if (!user) return [] as string[];
  const db = await serverClient();
  const { data, error } = await db
    .from("favorites")
    .select("drink_id")
    .eq("user_id", user.id);
  if (error) throw new Error("찜 상태를 불러오지 못했어요.");
  return (data ?? []).map((x) => x.drink_id as string);
}
