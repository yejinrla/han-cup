import { z } from "zod";
export function koreanDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export const reviewSchema = z.object({
  drinkId: z.uuid(),
  variantId: z.uuid().nullable().default(null),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).default(""),
  consumedOn: z.iso.date(),
  visibility: z.enum(["private", "public"]).default("private"),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
export function validateReview(input: unknown, now = new Date()): ReviewInput {
  const v = reviewSchema.parse(input);
  if (v.consumedOn > koreanDate(now))
    throw new Error("미래 날짜로는 기록할 수 없어요.");
  return v;
}
