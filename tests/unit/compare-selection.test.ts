import { test, expect } from "vitest";
import {
  addToComparison,
  readComparison,
  normalizeComparisonIds,
} from "@/features/compare/selection";
test("at most three unique variants and malformed stored data is safe", () => {
  expect(addToComparison(["a", "b", "c"], "d")).toEqual({
    ids: ["a", "b", "c"],
    reason: "full",
  });
  expect(addToComparison(["a"], "a").reason).toBe("duplicate");
  expect(addToComparison(["a"], "b").ids).toEqual(["a", "b"]);
  expect(readComparison("{broken")).toEqual([]);
  expect(readComparison("[1,null]")).toEqual([]);
});
test("review fix: repeated URL fields normalize without crashing", () => {
  expect(normalizeComparisonIds(["a,b", "b,c,d"])).toEqual(["a", "b", "c"]);
  expect(normalizeComparisonIds(undefined)).toEqual([]);
  expect(normalizeComparisonIds("a,b")).toEqual(["a", "b"]);
});
