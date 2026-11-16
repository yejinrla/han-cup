import { test, expect } from "@playwright/test";

test("search starts with discovery and saves personal query history", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(
    page.getByRole("heading", { name: "최근 검색어", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "급상승 검색어", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "추천 검색어", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "최근 본 음료", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-drink-card]")).toHaveCount(0);
  await page.getByLabel("음료명 또는 브랜드 검색").fill("라떼");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator("[data-drink-card]").first()).toBeVisible();
  await page.getByRole("link", { name: "검색 홈", exact: true }).click();
  const recent = page.getByRole("region", { name: "최근 검색어" });
  await expect(
    recent.getByRole("link", { name: "라떼", exact: true }),
  ).toBeVisible();
  await page.reload();
  await recent
    .getByRole("button", { name: "라떼 최근 검색어 삭제", exact: true })
    .click();
  await expect(
    recent.getByRole("link", { name: "라떼", exact: true }),
  ).toHaveCount(0);
});

test("recently viewed cards track real visits, clear and keep the chosen variant", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/drinks/mega-11");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("hancup.viewed.v1")))
    .toContain("mega-11");
  await page.goto("/search");
  const recent = page.getByRole("region", {
    name: "최근 본 음료",
    exact: true,
  });
  await expect(recent.getByRole("link")).toHaveCount(1);
  await expect(recent.getByRole("link")).toHaveAttribute(
    "href",
    /\/drinks\/mega-11\?variant=/,
  );
  await recent.getByRole("link").click();
  await expect(page).toHaveURL(/\/drinks\/mega-11\?variant=/);
  await page.goto("/search");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(recent.getByRole("link")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "음료 검색", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/hancup-search-discovery.png",
    fullPage: true,
  });
  await recent
    .getByRole("button", { name: "최근 본 음료 전체 삭제", exact: true })
    .click();
  await expect(recent.getByRole("link")).toHaveCount(0);
  await page.getByRole("link", { name: "#라떼", exact: true }).click();
  await expect(page.locator("[data-drink-card]").first()).toBeVisible();
});
test("search still works when browser storage is disabled", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    }),
  );
  await page.goto("/search");
  await page.getByLabel("음료명 또는 브랜드 검색").fill("라떼");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator("[data-drink-card]").first()).toBeVisible();
});
test("rising searches show only supplied aggregates and have a recoverable unavailable state", async ({
  page,
}) => {
  let failed = true;
  await page.route("**/api/search/activity", (route) =>
    route.fulfill({
      status: failed ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        failed
          ? { error: "unavailable" }
          : {
              available: true,
              items: [{ term: "라떼", recent: 5, previous: 1, growth: 4 }],
            },
      ),
    }),
  );
  await page.goto("/search");
  const rising = page.getByRole("region", {
    name: "급상승 검색어",
    exact: true,
  });
  await expect(
    rising.getByText("급상승 검색어를 불러오지 못했어요."),
  ).toBeVisible();
  failed = false;
  await rising
    .getByRole("button", { name: "다시 불러오기", exact: true })
    .click();
  await expect(
    rising.getByRole("link", { name: "라떼", exact: true }),
  ).toBeVisible();
  await rising.getByRole("link", { name: "라떼", exact: true }).click();
  await expect(page.locator("[data-drink-card]").first()).toBeVisible();
});
