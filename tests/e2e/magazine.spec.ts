import { test, expect } from "@playwright/test";

test("magazine collects articles and connects home, details and list", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "매거진 전체 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(
    page.getByRole("heading", { name: "한컵 매거진", exact: true }),
  ).toBeVisible();
  const cards = page.locator(".magazine-card");
  await expect(cards).toHaveCount(3);
  const entries = [
    ["autumn-tea", "가을에 마시기 좋은 차 추천"],
    ["sweet-coffee", "달콤한 커피가 생각나는 날"],
    ["your-latte", "나에게 맞는 라떼 한 잔"],
  ];
  for (const [slug, title] of entries) {
    await page.locator(`.magazine-card[href="/notes/${slug}"]`).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "홈으로", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "매거진 전체 보기", exact: true })
      .click();
    await expect(page).toHaveURL(/\/notes$/);
  }
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/notes");
    await expect(
      page
        .getByRole("navigation", { name: "주 메뉴" })
        .getByRole("link", { name: "홈", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(cards).toHaveCount(3);
  }
});
