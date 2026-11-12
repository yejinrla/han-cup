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
    page
      .getByRole("region", { name: "새로 나온 한 잔" })
      .getByRole("link", { name: "딥 초코 체리 프라페 상세 보기" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "새로 나온 한 잔" })
      .locator("[data-drink-card]"),
  ).toHaveCount(3);
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
  await expect(page.locator('select[name="brand"]')).toHaveValue("starbucks");
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
  // Initialize hydration, then resume the clock after each jump so the
  // asynchronous fetch response can commit through React rendering timers.
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("link", { name: "홈", exact: true })
    .focus();
  await page.clock.runFor(1000);
  await page.clock.fastForward(300000);
  await page.clock.resume();
  await expect(page.getByText("3명이 기록", { exact: true })).toBeVisible();
  await page.clock.fastForward(300000);
  await page.clock.resume();
  await expect(page.getByText("4명이 기록", { exact: true })).toBeVisible();
  await page.clock.fastForward(300000);
  await page.clock.resume();
  await expect(
    page.getByText("업데이트가 지연되고 있어요. 잠시 후 다시 확인할게요."),
  ).toBeVisible();
  await expect(page.getByText("4명이 기록", { exact: true })).toBeVisible();
});

test("fresh rankings do not renumber or hide unresolved catalog entries", async ({
  page,
}) => {
  const fixture = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile("data/catalog/initial.json", "utf8"),
  );
  await page.clock.install();
  await page.route("**/api/discovery/popular", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        items: [
          { drinkId: "10000000-0000-4000-8000-000000000001", recorders: 10 },
          { drinkId: fixture.drinks[0].id, recorders: 3 },
        ],
        updatedAt: "2026-11-12T12:00:00.000Z",
      }),
    }),
  );
  await page.goto("/");
  await page.clock.resume();
  const homeTab = page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("link", { name: "홈", exact: true });
  await homeTab.focus();
  await expect(homeTab).toHaveAttribute("aria-current", "page");
  await page.clock.runFor(1000);
  await page.clock.fastForward(300000);
  await page.clock.resume();
  const region = page.getByRole("region", { name: "지금 많이 기록하는 음료" });
  await expect(region.getByText("2위", { exact: true })).toBeVisible();
  await expect(region.getByText("1위", { exact: true })).toHaveCount(0);
  await expect(
    region.getByText(
      "최신 음료 정보를 불러오고 있어요. 준비된 음료부터 표시합니다.",
    ),
  ).toBeVisible();
  await expect(
    region.getByText("아직 최근 24시간의 음료 기록이 없어요."),
  ).toHaveCount(0);
});
