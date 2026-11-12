import { test, expect } from "vitest";
import { validateCatalog } from "../../scripts/catalog/schema";
const base = {
  schemaVersion: 1,
  reviewer: "operator",
  reviewedAt: "2026-11-12",
  changes: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      expectedRevision: 0,
      brandId: "starbucks",
      slug: "latte",
      name: "라떼",
      category: "coffee",
      status: "active",
      defaultVariantId: "20000000-0000-4000-8000-000000000001",
      variants: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          temperature: "iced",
          sizeLabel: "톨",
          cupMl: 355,
          nutritionBasisMl: null,
          nutrition: { caloriesKcal: 100, sugarG: 0, caffeineMg: null },
          priceKrw: null,
          source: {
            url: "https://www.starbucks.co.kr/menu/drink_view.do",
            checkedAt: "2026-11-12",
          },
          imagePath: null,
        },
      ],
    },
  ],
};
test("accepts reviewed nullable data without treating missing as zero", () => {
  const r = validateCatalog(base);
  expect(r.ok).toBe(true);
  if (r.ok)
    expect(r.batch.changes[0].variants[0].nutrition).toEqual({
      caloriesKcal: 100,
      sugarG: 0,
      caffeineMg: null,
    });
});
test("rejects unreviewed, bad units, duplicate variants and negative nutrients", () => {
  expect(validateCatalog({ ...base, reviewer: "" }).ok).toBe(false);
  const bad = structuredClone(base);
  bad.changes[0].variants[0].cupMl = -1;
  expect(validateCatalog(bad).ok).toBe(false);
  bad.changes[0].variants[0].cupMl = 355;
  bad.changes[0].variants.push(bad.changes[0].variants[0]);
  expect(validateCatalog(bad).ok).toBe(false);
});
test("requires https official source and valid date and assigned default variant", () => {
  const bad = structuredClone(base);
  bad.changes[0].variants[0].source.url = "https://unofficial.example";
  expect(validateCatalog(bad).ok).toBe(false);
  bad.changes[0].variants[0].source.url =
    base.changes[0].variants[0].source.url;
  bad.changes[0].defaultVariantId = "20000000-0000-4000-8000-000000000099";
  expect(validateCatalog(bad).ok).toBe(false);
});
