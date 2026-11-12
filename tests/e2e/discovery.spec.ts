import { test, expect } from "@playwright/test";
test("home offers new menus and recording trends while search is a separate bottom tab", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "새로 나온 한 잔", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "지금 많이 기록하는 음료", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("공식 출시 정보를 확인한 신메뉴를 준비하고 있어요."),
  ).toBeVisible();
  await expect(page.locator("[data-drink-card]")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  await expect(nav.getByRole("link")).toHaveCount(5);
  await nav.getByRole("link", { name: "음료 검색", exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByLabel("음료명 또는 브랜드 검색")).toBeVisible();
  await page.getByLabel("당류 상한").fill("10");
  await page.getByRole("button", { name: "필터 적용" }).click();
  await expect(page).toHaveURL(/\/search\?/);
  await expect(page.locator("[data-drink-card]")).toHaveCount(2);
  await expect(
    nav.getByRole("link", { name: "음료 검색", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "홈", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});
test("old home search links retain their filters and client popularity API exposes aggregate data only", async ({
  page,
}) => {
  await page.goto("/?brand=starbucks&maxSugar=10&basis=serving");
  await expect(page).toHaveURL(
    /\/search\?brand=starbucks&maxSugar=10&basis=serving/,
  );
  await expect(page.locator('select[name="brand"]')).toHaveValue(
    "starbucks",
  );
  await expect(page.getByLabel("당류 상한")).toHaveValue("10");
  const response = await page.request.get("/api/discovery/popular");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ available: false, items: [] });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("popularity refreshes every five minutes and keeps last results when refresh fails", async ({
  page,
}) => {
  const fixture = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile("data/catalog/initial.json", "utf8"),
  );
  const drinkId = fixture.drinks[0].id;
  await page.clock.install();
  let calls = 0;
  await page.route("**/api/discovery/popular", async (route) => {
    calls++;
    if (calls >= 3) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "unavailable" }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        items: [{ drinkId, recorders: calls + 2 }],
        updatedAt: "2026-11-12T12:00:00.000Z",
      }),
    });
  });
  await page.goto("/");
  // Allow React to attach its timer before advancing the browser clock.
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("link", { name: "홈", exact: true })
    .focus();
  await page.clock.runFor(1000);
  await page.clock.fastForward(300000);
  await expect(page.getByText("3명이 기록", { exact: true })).toBeVisible();
  await page.clock.fastForward(300000);
  await expect(page.getByText("4명이 기록", { exact: true })).toBeVisible();
  await page.clock.fastForward(300000);
  await expect(
    page.getByText("업데이트가 지연되고 있어요. 잠시 후 다시 확인할게요."),
  ).toBeVisible();
  await expect(page.getByText("4명이 기록", { exact: true })).toBeVisible();
});
