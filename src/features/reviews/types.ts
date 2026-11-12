import type { RatingSummary } from "@/features/catalog/types";
export type PublicReview = {
  id: string;
  nickname: string;
  rating: number;
  body: string;
  consumed_on: string;
};
export type PublicReviewPayload = {
  items: PublicReview[];
  summary: RatingSummary;
};
