import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { getCatalog } from "@/features/catalog/repository";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { JournalCalendar } from "@/features/reviews/components/JournalCalendar";
import { journalHref, resolveJournalDate } from "@/features/reviews/calendar";
import { loadJournalData } from "@/features/reviews/load-journal";
import { koreanDate } from "@/features/reviews/schema";
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
    drink?: string | string[];
    variant?: string | string[];
    edit?: string | string[];
    cursor?: string | string[];
    date?: string | string[];
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
  const editing =
    typeof p.edit === "string"
      ? (
          await db
            .from("reviews")
            .select("*")
            .eq("user_id", user.id)
            .eq("id", p.edit)
            .maybeSingle()
        ).data
      : null;
  const today = koreanDate();
  const selectedDate = resolveJournalDate(
    p.date ?? editing?.consumed_on,
    today,
  );
  const offset =
    typeof p.cursor === "string" && /^\d+$/.test(p.cursor)
      ? Math.min(Number(p.cursor), 10000)
      : 0;
  const {
    catalog: data,
    rows,
    recordDates,
  } = await loadJournalData(db, user.id, selectedDate, offset, getCatalog);
  const pageRows = rows.slice(0, 20);
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
        <Link href="/me/favorites">좋아요한 음료</Link>
        <Link href="/me/settings">계정 설정</Link>
      </nav>
      <JournalCalendar
        selectedDate={selectedDate}
        today={today}
        recordDates={recordDates}
      />
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
        <h2>
          {Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}
          일의 한 잔
        </h2>
        <p className="muted journal-day-caption">
          {selectedDate} · 마신 날짜 기준
        </p>
        {pageRows.length ? (
          pageRows.map((r) => {
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
                    href={journalHref(selectedDate, { edit: r.id })}
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
            <h3>
              {offset > 0
                ? "이 페이지에는 기록이 없어요"
                : "이날은 아직 기록이 없어요"}
            </h3>
            <p>
              {offset > 0
                ? "아래의 이전 기록 보기로 돌아가 주세요."
                : "음료를 둘러보고 한 잔의 기억을 남겨보세요."}
            </p>
            <Link className="primary-button" href="/search">
              음료 둘러보기
            </Link>
          </div>
        )}
        {offset > 0 && (
          <Link
            className="text-button"
            href={journalHref(selectedDate, {
              cursor: String(Math.max(0, offset - 20)),
            })}
          >
            ← 이전 기록 보기
          </Link>
        )}
        {(rows?.length ?? 0) > 20 && offset < 10000 && (
          <Link
            href={journalHref(selectedDate, { cursor: String(offset + 20) })}
          >
            다음 기록 보기 →
          </Link>
        )}
      </section>
    </main>
  );
}
