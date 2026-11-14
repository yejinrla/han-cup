import { test, expect } from "vitest";
import { validateReview } from "@/features/reviews/schema";
const base = {
  drinkId: "10000000-0000-4000-8000-000000000001",
  variantId: null,
  rating: 5,
  body: "",
  consumedOn: "2026-11-13",
};
const now = new Date("2026-11-12T15:00:00Z");
test("validates scores, Korean date and private default", () => {
  expect(validateReview(base, now).visibility).toBe("private");
  for (const rating of [0, 6, 1.5])
    expect(() => validateReview({ ...base, rating }, now)).toThrow();
  expect(() =>
    validateReview({ ...base, consumedOn: "2026-11-14" }, now),
  ).toThrow();
  expect(() =>
    validateReview({ ...base, body: "가".repeat(1001) }, now),
  ).toThrow();
  expect(
    validateReview({ ...base, body: "가".repeat(1000) }, now).body.length,
  ).toBe(1000);
  expect(() =>
    validateReview({ ...base, consumedOn: "2026-02-30" }, now),
  ).toThrow();
});

test("a record keeps the custom options the user chose", () => {
  expect(
    validateReview({ ...base, options: ["shot_extra", "ice_less"] }, now)
      .options,
  ).toEqual(["shot_extra", "ice_less"]);
});
