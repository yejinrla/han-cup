import { test, expect } from "@playwright/test";

// Drink cards stay compact on a phone: the variant facts sit in one meta line
// and a missing price takes no room on the card (the detail page explains it).
test("drink cards are compact and carry variant facts in one line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search");
  const cards = page.locator("[data-drink-card]");
  const heights = await cards.evaluateAll((all) =>
    all.map((card) => Math.round(card.getBoundingClientRect().height)),
  );
  expect(Math.max(...heights)).toBeLessThanOrEqual(300);

  const latte = cards.filter({ hasText: "1/2디카페인 카페 라떼" });
  await expect(latte.locator(".drink-meta")).toHaveText(
    "스타벅스 · ICE · Tall · 355ml",
  );
  await expect(latte).not.toContainText("가격");
  await expect(
    latte.getByRole("button", { name: "비교 담기", exact: true }),
  ).toBeVisible();
});
