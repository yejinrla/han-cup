"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { tasteNotes } from "@/features/notes/content";
import { articleTableMissing } from "./articles";

export async function setArticleFavorite(slug: string, enabled: boolean) {
  if (
    typeof enabled !== "boolean" ||
    !tasteNotes.some((note) => note.slug === slug)
  ) {
    return { error: "이 아티클을 찾을 수 없어요." };
  }
  const user = await requireUser(
    "/me/favorites?tab=articles&addArticle=" + encodeURIComponent(slug),
  );
  const db = await serverClient();
  const result = enabled
    ? await db
        .from("article_favorites")
        .insert({ user_id: user.id, article_slug: slug })
    : await db
        .from("article_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("article_slug", slug);
  if (result.error && !(enabled && result.error.code === "23505")) {
    return {
      error: articleTableMissing(result.error.code)
        ? "아티클 좋아요를 준비하고 있어요. 잠시 후 다시 이용해 주세요."
        : "아티클 좋아요를 저장하지 못했어요. 다시 시도해 주세요.",
    };
  }
  revalidatePath("/me/favorites");
  revalidatePath("/notes/" + slug);
  return { saved: enabled };
}
