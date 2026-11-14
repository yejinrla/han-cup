import { expect, test } from "vitest";
import { lowestIndex } from "@/features/compare/lowest";

// "가장 낮음" is only claimed when every value is known and one is clearly lowest.
test("marks the single lowest known value", () => {
  expect(lowestIndex([244, 319, 313])).toBe(0);
  expect(lowestIndex([46, 60, 41])).toBe(2);
  expect(lowestIndex([0, 12])).toBe(0);
});

test("marks nothing when the lowest value is shared", () => {
  expect(lowestIndex([0, 0, 181])).toBeNull();
  expect(lowestIndex([75, 75])).toBeNull();
});

test("marks nothing when any value is unknown or there is nothing to compare", () => {
  expect(lowestIndex([null, 319, 313])).toBeNull();
  expect(lowestIndex([null, null])).toBeNull();
  expect(lowestIndex([120])).toBeNull();
  expect(lowestIndex([])).toBeNull();
});
