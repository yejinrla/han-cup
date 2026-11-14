import "server-only";
import { currentUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { tasteNotes } from "@/features/notes/content";

export function articleTableMissing(code: string) {
  return code === "42P01" || code === "PGRST205";
}
export async function getArticleFavorites(userId?: string) {
  const id = userId ?? (await currentUser())?.id;
  if (!id) return { slugs: [] as string[], available: true };
  const db = await serverClient();
  const { data, error } = await db
    .from("article_favorites")
    .select("article_slug")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .order("article_slug");
  if (error) {
    if (articleTableMissing(error.code))
      return { slugs: [] as string[], available: false };
    throw new Error("아티클 좋아요를 불러오지 못했어요.");
  }
  const published = new Set(tasteNotes.map((note) => note.slug));
  return {
    slugs: (data ?? [])
      .map((row) => String(row.article_slug))
      .filter((slug) => published.has(slug)),
    available: true,
  };
}
