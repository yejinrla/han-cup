import Link from "next/link";
import { configured, serverClient } from "@/lib/supabase/server";
import { getSummaries } from "../repository";
import { ReportForm } from "./ReviewForm";
import { RefreshOnFocus } from "./RefreshOnFocus";
export async function PublicReviews({
  drinkId,
  variantId,
  offset = 0,
}: {
  drinkId: string;
  variantId: string;
  offset?: number;
}) {
  const db = configured() ? await serverClient() : null;
  const result = db
    ? await db.rpc("public_reviews", { product: drinkId, offset_rows: offset })
    : { data: [], error: null };
  if (result.error) throw new Error("후기를 불러오지 못했어요.");
  const summaries = await getSummaries(),
    summary = summaries[drinkId];
  return (
    <section className="panel">
      <RefreshOnFocus />
      <h2>이 한 잔, 어땠나요?</h2>
      <p className="muted">
        {summary?.count
          ? `★ ${summary.average} / 5 · ${summary.count}명의 공개 별점`
          : "아직 공개 평가가 없어요. 첫 한 잔을 기록해 보세요."}
      </p>
      <Link
        className="primary-button"
        style={{ marginTop: 18 }}
        href={`/me/records?drink=${drinkId}&variant=${variantId}`}
      >
        한 잔 기록하기
      </Link>
      {(result.data ?? []).map(
        (r: {
          id: string;
          nickname: string;
          rating: number;
          body: string;
          consumed_on: string;
        }) => (
          <article className="record" key={r.id}>
            <div className="record-head">
              <span>
                {r.nickname} · {"★".repeat(r.rating)}
              </span>
              <span>{r.consumed_on}</span>
            </div>
            <p className="record-body">{r.body || "별점으로 남긴 한 잔"}</p>
            <ReportForm reviewId={r.id} />
          </article>
        ),
      )}
      {result.data?.length === 20 && (
        <Link
          className="text-button"
          href={`?variant=${variantId}&reviews=${offset + 20}`}
        >
          다음 후기 보기 →
        </Link>
      )}
    </section>
  );
}
