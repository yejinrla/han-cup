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

test("an option outside the fixed list is refused", () => {
  expect(() =>
    validateReview({ ...base, options: ["gold_flakes"] }, now),
  ).toThrow();
});

test("five options are accepted and a sixth is refused", () => {
  const five = [
    "shot_extra",
    "syrup_less",
    "milk_change",
    "ice_less",
    "whip_none",
  ];
  expect(validateReview({ ...base, options: five }, now).options).toEqual(five);
  expect(() =>
    validateReview({ ...base, options: [...five, "decaf"] }, now),
  ).toThrow();
});

test("the same option twice is refused", () => {
  expect(() =>
    validateReview({ ...base, options: ["decaf", "decaf"] }, now),
  ).toThrow();
});

test("opposite options cannot be chosen together", () => {
  for (const pair of [
    ["shot_extra", "shot_light"],
    ["syrup_extra", "syrup_less"],
    ["syrup_less", "syrup_none"],
    ["syrup_extra", "syrup_none"],
    ["ice_less", "ice_extra"],
    ["whip_extra", "whip_none"],
  ])
    expect(() => validateReview({ ...base, options: pair }, now)).toThrow();
  // Options from different groups combine freely.
  expect(
    validateReview({ ...base, options: ["shot_extra", "syrup_none"] }, now)
      .options,
  ).toEqual(["shot_extra", "syrup_none"]);
});
