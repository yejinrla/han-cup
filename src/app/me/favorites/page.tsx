import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { getCatalog, joinCatalog } from "@/features/catalog/repository";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import { setFavorite } from "@/features/favorites/service";
export const metadata = {
  title: "좋아요한 음료",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Favorites({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const p = await searchParams;
  const user = await requireUser(
    "/me/favorites" + (p.add ? "?add=" + encodeURIComponent(p.add) : ""),
  );
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
      {p.add && !ids.has(p.add) && (
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
