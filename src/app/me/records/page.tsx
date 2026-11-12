import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { getCatalog } from "@/features/catalog/repository";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { deleteReview } from "@/features/reviews/service";
export const metadata = {
  title: "마신 기록",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Records({
  searchParams,
}: {
  searchParams: Promise<{
    drink?: string;
    variant?: string;
    edit?: string;
    cursor?: string;
  }>;
}) {
  const p = await searchParams;
  const returnTo =
    "/me/records?" +
    new URLSearchParams(
      Object.entries(p).filter(([, v]) => typeof v === "string") as [
        string,
        string,
      ][],
    );
  const user = await requireUser(returnTo);
  const db = await serverClient();
  const data = await getCatalog();
  const offset = /^\d+$/.test(p.cursor ?? "")
    ? Math.min(Number(p.cursor), 10000)
    : 0;
  const { data: rows, error } = await db
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("consumed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + 19);
  if (error) throw new Error("기록을 불러오지 못했어요.");
  const editing = p.edit
    ? (
        await db
          .from("reviews")
          .select("*")
          .eq("user_id", user.id)
          .eq("id", p.edit)
          .maybeSingle()
      ).data
    : null;
  const selected = data.drinks.find(
    (d) => d.id === (editing?.drink_id ?? p.drink),
  );
  const variant = selected
    ? data.variants.find((v) => v.drinkId === selected.id && v.id === p.variant)
    : null;
  return (
    <main id="main" className="page-wrap">
      <p className="eyebrow">YOUR CUP JOURNAL</p>
      <h1 className="page-heading">나의 한 잔 기록</h1>
      <p className="page-intro">좋았던 한 모금도, 새로운 발견도 차곡차곡.</p>
      <nav className="personal-tabs">
        <Link href="/me/records">마신 기록</Link>
        <Link href="/me/favorites">찜한 음료</Link>
        <Link href="/me/settings">계정 설정</Link>
      </nav>
      {selected && (
        <section className="panel">
          <h2>
            {selected.name} {editing ? "기록 수정" : "기록하기"}
          </h2>
          <ReviewForm
            key={editing?.id ?? selected.id}
            drinkId={selected.id}
            variantId={variant?.id ?? null}
            existing={
              editing
                ? {
                    id: editing.id,
                    drinkId: editing.drink_id,
                    variantId: editing.variant_id,
                    rating: editing.rating,
                    body: editing.body,
                    consumedOn: editing.consumed_on,
                    visibility: editing.visibility,
                  }
                : undefined
            }
          />
        </section>
      )}
      <section className="panel">
        <h2>마신 음료 {rows?.length ?? 0}개</h2>
        {rows?.length ? (
          rows.map((r) => {
            const d = data.drinks.find((x) => x.id === r.drink_id);
            return (
              <article className="record" key={r.id}>
                <div className="record-head">
                  <Link href={"/drinks/" + d?.slug}>
                    {d?.name ?? "음료 기록"}
                  </Link>
                  <span>{r.consumed_on}</span>
                </div>
                <p className="record-body">
                  {"★".repeat(r.rating)}　
                  <span className="badge">
                    {r.visibility === "public" ? "공개" : "나만 보기"}
                  </span>
                  {d?.status === "discontinued" && (
                    <span className="badge">판매 종료</span>
                  )}
                </p>
                <p className="record-body">{r.body}</p>
                {r.moderation_status === "hidden" && (
                  <p className="status-box">
                    운영자가 공개 노출을 숨긴 기록입니다. {r.moderation_reason}
                  </p>
                )}
                <div className="form-row">
                  <Link
                    className="text-button"
                    href={"/me/records?edit=" + r.id}
                  >
                    수정 / 공개 범위 변경
                  </Link>
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-button danger">기록 삭제</button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <h3>첫 한 잔을 기다리고 있어요</h3>
            <p>음료 상세에서 ‘한 잔 기록하기’를 눌러보세요.</p>
            <Link className="primary-button" href="/">
              음료 둘러보기
            </Link>
          </div>
        )}
        {rows?.length === 20 && (
          <Link href={"/me/records?cursor=" + (offset + 20)}>
            다음 기록 보기 →
          </Link>
        )}
      </section>
    </main>
  );
}
