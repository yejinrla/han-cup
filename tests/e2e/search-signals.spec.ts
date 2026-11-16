import { test, expect } from "@playwright/test";

// The search page claims only what the catalog has: the brand count counts
// brands with drinks, brands without drinks say "(준비 중)", and the price
// sort appears only when some price is known (none is, in the current data).
// Expectations follow the local catalog JSON (4 brands with drinks, no prices);
// they change if the tests run against a configured Supabase catalog.
test("search shows the real brand count, marks brands in preparation and hides the empty price sort", async ({
  page,
}) => {
  await page.goto("/search?all=1");
  await expect(page.locator(".collection-count")).toHaveText("4개 브랜드 탐색");

  const brand = page.locator('select[name="brand"]');
  await expect(brand.locator('option[value="twosome"]')).toHaveText(
    "투썸플레이스 (준비 중)",
  );
  await expect(brand.locator('option[value="compose"]')).toHaveText(
    "컴포즈커피 (준비 중)",
  );
  await expect(brand.locator('option[value="mega"]')).toHaveText("메가MGC커피");
  // Still selectable: the empty result explains itself as before.
  await brand.selectOption("compose");
  await page.getByRole("button", { name: "필터 적용" }).click();
  await expect(page).toHaveURL(/brand=compose/);
  await expect(
    page.getByRole("heading", { name: "조건에 맞는 음료가 없어요" }),
  ).toBeVisible();

  await expect(
    page.getByLabel("음료 정렬").locator('option[value="price"]'),
  ).toHaveCount(0);
});

test("an old price-sort link keeps its sort selected", async ({ page }) => {
  await page.goto("/search?sort=price");
  await expect(page.getByLabel("음료 정렬")).toHaveValue("price");
});
