import Link from "next/link";
import { configured } from "@/lib/supabase/server";
import { PublicReviewFeed } from "./PublicReviewFeed";
export function PublicReviews({
  drinkId,
  variantId,
  offset = 0,
}: {
  drinkId: string;
  variantId: string;
  offset?: number;
}) {
  return (
    <section className="panel">
      <h2>이 한 잔, 어땠나요?</h2>
      <Link
        className="primary-button"
        style={{ margin: "12px 0 20px" }}
        href={`/me/records?drink=${drinkId}&variant=${variantId}`}
      >
        한 잔 기록하기
      </Link>
      <PublicReviewFeed
        drinkId={drinkId}
        variantId={variantId}
        offset={offset}
        enabled={configured()}
      />
    </section>
  );
}
