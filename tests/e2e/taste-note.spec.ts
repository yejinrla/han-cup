import { test, expect } from "@playwright/test";
test("home taste-note card sits after search and opens an article with usable recommendations", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("link", {
    name: "음료명이나 브랜드로 찾아보세요",
    exact: true,
  });
  const note = page.getByRole("link", { name: /가을에 마시기 좋은 차 추천/ });
  await expect(note).toBeVisible();
  const a = await search.boundingBox(),
    b = await note.boundingBox();
  expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
  await note.click();
  await expect(page).toHaveURL(/\/notes\/autumn-tea$/);
  await expect(
    page.getByRole("heading", {
      name: "가을에 마시기 좋은 차 추천",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "따뜻한 차가 생각나는 순간",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("[data-drink-card]")).toHaveCount(2);
  await expect(
    page
      .getByRole("navigation", { name: "주 메뉴" })
      .getByRole("link", { name: "홈", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("link", { name: "매실 모과차 상세 보기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "매실 모과차", exact: true }),
  ).toBeVisible();
  await page.goto("/notes/no-such-note");
  await expect(
    page.getByRole("heading", { name: "이 한 잔을 찾지 못했어요" }),
  ).toBeVisible();
});
