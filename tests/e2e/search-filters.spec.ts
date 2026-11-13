import { test, expect } from "@playwright/test";

// Search filters fit one row: category chips, brand/temperature selects and a
// collapsible nutrition panel. Every control still speaks the existing URL
// parameters and keeps the other conditions.
test.use({ viewport: { width: 390, height: 844 } });

const panel = (page: import("@playwright/test").Page) =>
  page.locator("details.nutrition-panel");
// Opens the nutrition panel unless it is already open (it stays open across
// chip navigation within the search page).
const openPanel = async (page: import("@playwright/test").Page) => {
  if ((await panel(page).getAttribute("open")) === null)
    await panel(page).locator("summary").click();
  await expect(panel(page)).toHaveAttribute("open", "");
};

test("nutrition limits live in a panel that opens with a count when set", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(page.getByLabel("음료명 또는 브랜드 검색")).toHaveAttribute(
    "placeholder",
    "음료명이나 브랜드",
  );
  await expect(page.getByLabel("당류 상한")).toBeHidden();
  await openPanel(page);
  await expect(page.getByLabel("당류 상한")).toHaveAttribute(
    "placeholder",
    "제한 없음",
  );

  await page.getByRole("link", { name: "티", exact: true }).click();
  await expect(page).toHaveURL(/category=tea/);
  // Wait for the new page to render before using the panel again.
  await expect(
    page.getByRole("link", { name: "티", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await openPanel(page);
  await page.getByLabel("당류 상한").fill("60");
  await page.getByRole("button", { name: "필터 적용" }).click();
  await expect(page).toHaveURL(/category=tea/);
  await expect(page).toHaveURL(/maxSugar=60/);
  await expect(panel(page)).toHaveAttribute("open", "");
  await expect(panel(page).locator("summary")).toHaveText("영양 조건 1");
});

test("quick picks fill the existing limits in the current basis", async ({
  page,
}) => {
  await page.goto("/search?brand=mega");
  await openPanel(page);
  await page.getByRole("link", { name: "당류 10g 이하" }).click();
  await expect(page).toHaveURL(/maxSugar=10/);
  await expect(page).toHaveURL(/brand=mega/);
  await expect(page.getByText("총 1개의 음료")).toBeVisible();

  await page.goto("/search?basis=100ml");
  await openPanel(page);
  await expect(
    page.getByRole("link", { name: "100ml당 당류 10g 이하" }),
  ).toBeVisible();
});

test("brand and temperature apply without opening the panel and reset stays on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/search");
  await page.locator('select[name="temperature"]').selectOption("hot");
  await page.getByRole("button", { name: "필터 적용" }).click();
  await expect(page).toHaveURL(/temperature=hot/);
  await expect(page.getByText("총 2개의 음료")).toBeVisible();
  const reset = page.getByRole("link", { name: "조건 초기화" }).first();
  const box = (await reset.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  await reset.click();
  await expect(page).toHaveURL(/\/search\??$/);
});
