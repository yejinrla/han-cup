import Link from "next/link";
import { redirect } from "next/navigation";
import { tasteNotes } from "@/features/notes/content";
import { ArticleCard } from "@/features/notes/ArticleCard";
import { getArticleFavorites } from "@/features/favorites/articles";
import { setArticleFavorite } from "@/features/favorites/article-service";
import { ArticleFavoriteButton } from "@/features/favorites/components/ArticleFavoriteButton";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { getCatalog, joinCatalog } from "@/features/catalog/repository";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import { setFavorite } from "@/features/favorites/service";
export const metadata = {
  title: "좋아요",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Favorites({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; tab?: string; addArticle?: string }>;
}) {
  const p = await searchParams;
  const articleTab = p.tab === "articles";
  const next = new URLSearchParams();
  if (articleTab) next.set("tab", "articles");
  if (typeof p.add === "string") next.set("add", p.add);
  if (typeof p.addArticle === "string") next.set("addArticle", p.addArticle);
  const user = await requireUser(
    "/me/favorites" + (next.size ? "?" + next : ""),
  );
  if (articleTab) {
    const favorites = await getArticleFavorites(user.id);
    const articles = favorites.slugs.flatMap((slug) => {
      const note = tasteNotes.find((note) => note.slug === slug);
      return note ? [note] : [];
    });
    const proposed = tasteNotes.find((note) => note.slug === p.addArticle);
    async function confirmArticle(form: FormData) {
      "use server";
      const result = await setArticleFavorite(String(form.get("slug")), true);
      if (result.error) throw new Error(result.error);
      redirect("/me/favorites?tab=articles");
    }
    return (
      <main id="main" className="page-wrap">
        <p className="eyebrow">MY LITTLE COLLECTION</p>
        <h1 className="page-heading">좋아요한 아티클</h1>
        <p className="page-intro">
          다시 읽고 싶은 한 잔의 이야기를 모아보세요.
        </p>
        <FavoriteTabs articles />
        {!favorites.available ? (
          <p className="status-box" role="status">
            아티클 좋아요를 준비하고 있어요. 잠시 후 다시 이용해 주세요.
          </p>
        ) : (
          <>
            {proposed && !favorites.slugs.includes(proposed.slug) && (
              <form action={confirmArticle} className="status-box">
                <input type="hidden" name="slug" value={proposed.slug} />
                <p>‘{proposed.title}’ 아티클을 좋아요 목록에 저장할까요?</p>
                <button className="primary-button">아티클 좋아요하기</button>
              </form>
            )}
            {articles.length ? (
              <ul className="magazine-list" aria-label="좋아요한 아티클 목록">
                {articles.map((note, index) => (
                  <li key={note.slug}>
                    <ArticleCard note={note} index={index} />
                    <div className="saved-article-actions">
                      <ArticleFavoriteButton slug={note.slug} initial />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <h2>아직 좋아요한 아티클이 없어요</h2>
                <p>마음에 드는 글에 하트를 눌러 다시 읽어보세요.</p>
                <Link href="/notes" className="primary-button">
                  매거진 둘러보기
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    );
  }
  const db = await serverClient();
  const { data, error } = await db
    .from("favorites")
    .select("drink_id")
    .eq("user_id", user.id);
  if (error) throw new Error("좋아요 목록을 불러오지 못했어요.");
  const ids = new Set((data ?? []).map((x) => x.drink_id));
  const items = joinCatalog(await getCatalog()).filter((x) => ids.has(x.id));
  async function add(form: FormData) {
    "use server";
    await setFavorite(String(form.get("drinkId")), true);
  }
  return (
    <main id="main" className="page-wrap">
      <p className="eyebrow">MY LITTLE COLLECTION</p>
      <h1 className="page-heading">좋아요한 음료</h1>
      <p className="page-intro">하트를 누른 음료를 한곳에서 다시 만나보세요.</p>
      <FavoriteTabs />
      {typeof p.add === "string" && !ids.has(p.add) && (
        <form action={add} className="status-box">
          <input type="hidden" name="drinkId" value={p.add} />
          <p>선택한 음료를 좋아요 목록에 저장할까요?</p>
          <button className="primary-button">좋아요하기</button>
        </form>
      )}
      {items.length ? (
        <div className="drink-grid">
          {items.map((x, i) => (
            <div key={x.id}>
              {x.status === "discontinued" && (
                <span className="badge">판매 종료</span>
              )}
              <DrinkCard item={x} isFavorite index={i} basis="serving" />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>아직 좋아요한 음료가 없어요</h2>
          <p>도감에서 하트를 눌러 다음 한 잔을 골라보세요.</p>
          <Link className="primary-button" href="/search">
            음료 둘러보기
          </Link>
        </div>
      )}
    </main>
  );
}

function FavoriteTabs({ articles = false }: { articles?: boolean }) {
  return (
    <nav className="favorite-kind-tabs" aria-label="좋아요 종류">
      <Link href="/me/favorites" aria-current={!articles ? "page" : undefined}>
        음료
      </Link>
      <Link
        href="/me/favorites?tab=articles"
        aria-current={articles ? "page" : undefined}
      >
        아티클
      </Link>
    </nav>
  );
}
