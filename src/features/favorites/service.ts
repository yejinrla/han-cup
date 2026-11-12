"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { z } from "zod";
export async function setFavorite(drinkId: string, enabled: boolean) {
  z.uuid().parse(drinkId);
  const user = await requireUser("/me/favorites?add=" + drinkId);
  const db = await serverClient();
  if (enabled) {
    const r = await db
      .from("favorites")
      .insert({ user_id: user.id, drink_id: drinkId });
    if (r.error && r.error.code !== "23505")
      throw new Error("찜을 저장하지 못했어요.");
  } else {
    const r = await db
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("drink_id", drinkId);
    if (r.error) throw new Error("찜을 해제하지 못했어요.");
  }
  revalidatePath("/me/favorites");
}
export async function toggleFavorite(drinkId: string) {
  const user = await requireUser("/me/favorites?add=" + drinkId);
  const db = await serverClient();
  const { data, error } = await db
    .from("favorites")
    .select("drink_id")
    .eq("user_id", user.id)
    .eq("drink_id", drinkId)
    .maybeSingle();
  if (error) return { error: "찜 상태를 불러오지 못했어요." };
  try {
    await setFavorite(drinkId, !data);
    return { saved: !data };
  } catch {
    return { error: "저장하지 못했어요. 다시 시도해 주세요." };
  }
}
