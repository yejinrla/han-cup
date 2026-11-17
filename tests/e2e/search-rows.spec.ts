import { test, expect } from "@playwright/test";

// Search results list drinks as compact rows so more fit on a phone screen;
// other screens keep the image card.
test("search results fit at least three complete rows above the tab bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search?all=1");
  const rows = page.locator("[data-drink-card]");
  await expect(rows.first()).toBeVisible();
  // The local-catalog notice only renders without Supabase; production does
  // not show it, so measure the first screen as production lays it out.
  await page
    .locator(".data-notice")
    .evaluateAll((all) => all.forEach((n) => n.remove()));
  const tabTop = await page
    .locator("nav")
    .last()
    .evaluate((n) => n.getBoundingClientRect().top);
  const complete = await rows.evaluateAll(
    (all, limit) =>
      all.filter((r) => r.getBoundingClientRect().bottom <= limit).length,
    tabTop,
  );
  expect(complete).toBeGreaterThanOrEqual(3);

  const latte = rows.filter({ hasText: "1/2디카페인 카페 라떼" });
  await expect(latte.locator(".drink-meta")).toHaveText(
    "스타벅스 · ICE · Tall · 355ml",
  );
  await expect(
    latte.getByRole("link", { name: "1/2디카페인 카페 라떼", exact: true }),
  ).toBeVisible();
  await expect(latte.locator(".nutrition-strip")).toContainText("110kcal");
  await expect(latte.locator(".nutrition-strip")).toContainText("8g");
  await expect(latte.locator(".nutrition-strip")).toContainText("40mg");
  await expect(
    latte.getByRole("button", { name: "비교 담기", exact: true }),
  ).toBeVisible();
  await expect(
    latte.getByRole("button", { name: "음료 찜하기" }),
  ).toBeVisible();
  await expect(latte).not.toContainText("평가 없음");
});

test("home arrivals keep the image card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const card = page
    .getByRole("region", { name: "최근 신메뉴" })
    .locator("[data-drink-card]")
    .first();
  await expect(card).toBeVisible();
  await expect(card).not.toHaveClass(/drink-row/);
  const visual = await card
    .locator(".drink-visual")
    .evaluate((v) => v.getBoundingClientRect().height);
  // Rows use a 52px cup; the arrival rail card keeps its larger picture.
  expect(visual).toBeGreaterThan(60);
});
