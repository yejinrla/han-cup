import { test, expect } from "vitest";
import {
  isSearchResults,
  eligibleSearchTerm,
  recommendedTerms,
} from "@/features/search/discovery";
import { readRecent, pushRecent } from "@/features/search/history";
import type { CatalogData } from "@/features/catalog/types";
import catalog from "../../data/catalog/initial.json";
const now = 1_800_000_000_000;
test("only explicit browsing, nonempty terms or meaningful filters show results", () => {
  for (const q of ["", "q=++", "utm_source=home"])
    expect(isSearchResults(new URLSearchParams(q))).toBe(false);
  for (const q of [
    "q=라떼",
    "all=1",
    "brand=mega",
    "category=tea",
    "sort=price",
    "maxSugar=0",
    "basis=100ml",
  ])
    expect(isSearchResults(new URLSearchParams(q))).toBe(true);
});
test("personal history is bounded, deduplicated, expiring and resilient to malformed input", () => {
  expect(readRecent("invalid", now)).toEqual([]);
  expect(
    readRecent(
      JSON.stringify([
        null,
        { value: "", at: now },
        { value: "x", at: 0 },
        { value: "x", at: now + 86400000 },
      ]),
      now,
    ),
  ).toEqual([]);
  let raw: string | null = null;
  for (let i = 0; i < 15; i++) raw = pushRecent(raw, "단어" + i, now + i, 10);
  const list = readRecent(raw, now + 100);
  expect(list).toHaveLength(10);
  expect(list[0].value).toBe("단어14");
  raw = pushRecent(raw, " 단어10 ", now + 101, 10);
  expect(readRecent(raw, now + 102)[0].value).toBe("단어10");
  expect(
    readRecent(raw, now + 102).filter((x) => x.value === "단어10"),
  ).toHaveLength(1);
});
test("arbitrary private free text is never eligible for published search statistics", () => {
  expect(
    eligibleSearchTerm("010-1234-5678", catalog as CatalogData),
  ).toBeNull();
  expect(
    eligibleSearchTerm("my@email.example", catalog as CatalogData),
  ).toBeNull();
  expect(eligibleSearchTerm("라떼", catalog as CatalogData)).toBe("라떼");
  expect(
    recommendedTerms(catalog as CatalogData).every(
      (term) => eligibleSearchTerm(term, catalog as CatalogData) === term,
    ),
  ).toBe(true);
});
