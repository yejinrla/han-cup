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
      {/* The record action sits at the top of the detail page. */}
      <h2>이 한 잔, 어땠나요?</h2>
      <PublicReviewFeed
        drinkId={drinkId}
        variantId={variantId}
        offset={offset}
        enabled={configured()}
      />
    </section>
  );
}
