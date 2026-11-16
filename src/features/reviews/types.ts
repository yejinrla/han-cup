import type { RatingSummary } from "@/features/catalog/types";
export type PublicReview = {
  id: string;
  nickname: string;
  rating: number;
  body: string;
  consumed_on: string;
  /** Present after migration 009; public records only. */
  options?: string[];
};
export type PublicReviewPayload = {
  items: PublicReview[];
  summary: RatingSummary;
};
